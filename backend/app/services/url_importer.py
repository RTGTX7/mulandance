import ipaddress
import re
import socket
import uuid
import html as html_lib
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from bs4 import BeautifulSoup

from app.core.config import settings
from app.schemas.ai import ImportedMedia, ImportedSource

MAX_HTML_BYTES = 2 * 1024 * 1024
MAX_IMAGE_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
USER_AGENT = "Mozilla/5.0 (compatible; MulandanceCMS/1.0; +https://mulandance.local)"
TRUSTED_NON_PUBLIC_DNS_SUFFIXES = (
    "rednote.com",
    "xiaohongshu.com",
    "rednotecdn.com",
    "xhscdn.com",
)


def _hostname_matches_suffix(hostname: str, suffix: str) -> bool:
    normalized = hostname.lower().rstrip(".")
    normalized_suffix = suffix.lower().rstrip(".")
    return normalized == normalized_suffix or normalized.endswith(f".{normalized_suffix}")


def _allows_non_public_dns(hostname: str) -> bool:
    return any(_hostname_matches_suffix(hostname, suffix) for suffix in TRUSTED_NON_PUBLIC_DNS_SUFFIXES)


def _is_public_hostname(hostname: str) -> bool:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    allow_trusted_non_public = _allows_non_public_dns(hostname)
    for info in infos:
        address = info[4][0]
        try:
            ip = ipaddress.ip_address(address)
        except ValueError:
            return False
        blocked = (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        )
        if blocked and not allow_trusted_non_public:
            return False
    return True


def _validate_public_url(url: str) -> urllib.parse.ParseResult:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Only http and https URLs are supported.")
    if not parsed.hostname:
        raise ValueError("URL is missing a hostname.")
    if not _is_public_hostname(parsed.hostname):
        raise ValueError("URL host is not allowed.")
    return parsed


def _read_url(url: str, *, max_bytes: int, timeout: int = 15) -> tuple[bytes, str, str]:
    _validate_public_url(url)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        final_url = response.geturl()
        _validate_public_url(final_url)
        content_type = (response.headers.get("content-type") or "").split(";")[0].strip().lower()
        data = response.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ValueError("Downloaded content is too large.")
    return data, content_type, final_url


def _meta_content(soup: BeautifulSoup, *names: str) -> str:
    for name in names:
        tag = soup.find("meta", attrs={"property": name}) or soup.find("meta", attrs={"name": name})
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
    return ""


def _meta_contents(soup: BeautifulSoup, *names: str) -> list[str]:
    values: list[str] = []
    for name in names:
        for tag in [
            *soup.find_all("meta", attrs={"property": name}),
            *soup.find_all("meta", attrs={"name": name}),
        ]:
            content = str(tag.get("content") or "").strip()
            if content and content not in values:
                values.append(content)
    return values


def _clean_text(text: str, max_length: int = 7000) -> str:
    collapsed = re.sub(r"\s+", " ", text or "").strip()
    return collapsed[:max_length]


def _timestamp_to_iso(value: str) -> str:
    try:
        timestamp = int(value)
    except (TypeError, ValueError):
        return ""
    if timestamp > 10_000_000_000:
        timestamp = timestamp / 1000
    try:
        return datetime.fromtimestamp(timestamp, timezone.utc).isoformat()
    except (OSError, OverflowError, ValueError):
        return ""


def _month_name_to_number(value: str) -> int | None:
    months = {
        "jan": 1,
        "january": 1,
        "feb": 2,
        "february": 2,
        "mar": 3,
        "march": 3,
        "apr": 4,
        "april": 4,
        "may": 5,
        "jun": 6,
        "june": 6,
        "jul": 7,
        "july": 7,
        "aug": 8,
        "august": 8,
        "sep": 9,
        "sept": 9,
        "september": 9,
        "oct": 10,
        "october": 10,
        "nov": 11,
        "november": 11,
        "dec": 12,
        "december": 12,
    }
    return months.get(value.strip().lower())


def _parse_visible_date(value: str) -> str:
    cleaned = _clean_text(value, 80)
    year = datetime.utcnow().year

    match = re.search(r"(?P<month>\d{1,2})[-/.](?P<day>\d{1,2})(?:[-/.](?P<year>\d{2,4}))?", cleaned)
    if match:
        parsed_year = int(match.group("year") or year)
        if parsed_year < 100:
            parsed_year += 2000
        try:
            return datetime(parsed_year, int(match.group("month")), int(match.group("day")), tzinfo=timezone.utc).isoformat()
        except ValueError:
            return ""

    match = re.search(r"(?P<month>[A-Za-z]+)\s+(?P<day>\d{1,2})(?:,\s*(?P<year>\d{4}))?", cleaned)
    if match:
        month = _month_name_to_number(match.group("month"))
        if not month:
            return ""
        parsed_year = int(match.group("year") or year)
        try:
            return datetime(parsed_year, month, int(match.group("day")), tzinfo=timezone.utc).isoformat()
        except ValueError:
            return ""

    return ""


def _extract_source_published_at(soup: BeautifulSoup, html_text: str) -> str:
    timestamp_keys = ("lastUpdateTime", "publishTime", "createTime", "createdTime", "postTime")
    for key in timestamp_keys:
        match = re.search(rf'"{re.escape(key)}"\s*:\s*"?(\d{{10,13}})"?', html_text)
        if match:
            parsed = _timestamp_to_iso(match.group(1))
            if parsed:
                return parsed

    for selector in (".date", "[class*=date]", "time"):
        for tag in soup.select(selector):
            parsed = _parse_visible_date(tag.get_text(" ", strip=True))
            if parsed:
                return parsed

    return ""


def _extract_html_source(url: str, html: bytes, final_url: str) -> ImportedSource:
    html_text = html.decode("utf-8", "replace")
    soup = BeautifulSoup(html_text, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    title = _meta_content(soup, "og:title", "twitter:title") or (soup.title.string.strip() if soup.title and soup.title.string else "")
    description = _meta_content(soup, "description", "og:description", "twitter:description")
    page_text = _clean_text(" ".join(soup.stripped_strings))

    images: list[str] = []
    for candidate in [
        *_meta_contents(soup, "og:image", "twitter:image", "twitter:image:src"),
        *[str(img.get("src", "")) for img in soup.find_all("img")],
    ]:
        if not candidate:
            continue
        if candidate.startswith("data:"):
            continue
        absolute = urllib.parse.urljoin(final_url, candidate)
        if absolute not in images:
            images.append(absolute)
        if len(images) >= max(settings.AI_MAX_IMAGES_PER_URL * 2, settings.AI_MAX_IMAGES_PER_URL):
            break

    return ImportedSource(
        url=url,
        title=_clean_text(title, 300),
        description=_clean_text(description, 1000),
        text=page_text,
        source_published_at=_extract_source_published_at(soup, html_lib.unescape(html_text)),
        images=images,
    )


def _image_upload_dir() -> tuple[Path, str, str]:
    now = datetime.utcnow()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    upload_root = Path(settings.UPLOADS_DIR)
    target_dir = upload_root / "images" / "imported" / year / month
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir, year, month


def _download_image(url: str) -> ImportedMedia:
    data, content_type, final_url = _read_url(url, max_bytes=MAX_IMAGE_BYTES, timeout=20)
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(f"Unsupported image type: {content_type or 'unknown'}")

    upload_dir, year, month = _image_upload_dir()
    ext = ALLOWED_IMAGE_TYPES[content_type]
    filename = f"{uuid.uuid4().hex}{ext}"
    relative_path = f"images/imported/{year}/{month}/{filename}"
    file_path = upload_dir / filename
    file_path.write_bytes(data)
    return ImportedMedia(
        url=f"{(settings.PUBLIC_BASE_URL or 'http://localhost:8000').rstrip('/')}/static/uploads/{relative_path}",
        path=relative_path,
        source_url=final_url,
        content_type=content_type,
        size=len(data),
    )


def import_url(url: str) -> ImportedSource:
    warnings: list[str] = []
    try:
        html, content_type, final_url = _read_url(url, max_bytes=MAX_HTML_BYTES)
    except (ValueError, urllib.error.URLError) as exc:
        return ImportedSource(url=url, warnings=[f"Fetch failed: {exc}"])

    if content_type and "html" not in content_type:
        return ImportedSource(url=url, warnings=[f"URL did not return HTML: {content_type}"])

    source = _extract_html_source(url, html, final_url)
    media: list[ImportedMedia] = []
    for image_url in source.images[: settings.AI_MAX_IMAGES_PER_URL]:
        try:
            media.append(_download_image(image_url))
        except Exception as exc:
            warnings.append(f"Image skipped: {image_url} ({exc})")
    source.media = media
    source.warnings = warnings
    return source


def import_urls(urls: list[str]) -> list[ImportedSource]:
    limited = urls[: settings.AI_MAX_URLS]
    return [import_url(url) for url in limited]
