export function toPublicMediaUrl(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/static/uploads/')) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    // Relative URLs are already suitable for same-origin proxying.
  }

  return url;
}
