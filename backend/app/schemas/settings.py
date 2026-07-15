from typing import Any, Dict, List, Literal

from pydantic import BaseModel, Field


class RegistrationLinks(BaseModel):
    registration_url: str = Field(default="", max_length=1000)
    summer_camp_registration_url: str = Field(default="", max_length=1000)
    summer_camp_enabled: bool = False


class RegistrationLinksUpdate(RegistrationLinks):
    pass


class SystemSettingsBase(BaseModel):
    site_name: str = Field(default="Mulan Dance Studio", max_length=200)
    logo_url: str = Field(default="/logo.png", max_length=1000)
    header_cta_label: str = Field(default="Register", max_length=100)
    header_cta_href: str = Field(default="/classes/register", max_length=1000)
    show_admin_login: bool = True
    announcement_enabled: bool = False
    announcement_text: str = Field(default="", max_length=500)
    announcement_href: str = Field(default="", max_length=1000)
    footer_description: str = ""
    footer_newsletter_title: str = Field(default="Join Us", max_length=200)
    footer_newsletter_text: str = ""
    copyright_text: str = Field(default="All rights reserved.", max_length=500)
    privacy_href: str = Field(default="/privacy", max_length=1000)
    contact_email: str = Field(default="info@mulandance.com", max_length=255)
    contact_phone: str = Field(default="3437771766", max_length=100)
    contact_address: str = ""
    outbound_email: str = Field(default="", max_length=255)
    classroom_request_limit_per_contact: int = Field(default=0, ge=0, le=999)
    program_pricing_json: str = ""
    classroom_pricing_json: str = ""
    youtube_url: str = Field(default="https://www.youtube.com/@mulandancestudio21", max_length=1000)
    xiaohongshu_url: str = Field(default="https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476", max_length=1000)
    instagram_url: str = Field(default="", max_length=1000)
    facebook_url: str = Field(default="", max_length=1000)
    tiktok_url: str = Field(default="", max_length=1000)
    translations: dict = {}


class SystemSettingsResponse(SystemSettingsBase):
    pass


class SystemSettingsUpdate(SystemSettingsBase):
    pass


class SystemSettingsDraftResponse(BaseModel):
    settings: SystemSettingsResponse
    is_dirty: bool = False
    published_at: str | None = None


class HomepageButton(BaseModel):
    label: str = Field(default="", max_length=100)
    href: str = Field(default="", max_length=1000)


class HomepageHeroSlide(BaseModel):
    badge: str = Field(default="", max_length=100)
    title: str = Field(default="", max_length=200)
    subtitle: str = Field(default="", max_length=500)
    primary: HomepageButton = Field(default_factory=HomepageButton)
    secondary: HomepageButton = Field(default_factory=HomepageButton)
    image_url: str = Field(default="", max_length=1000)
    overlay: str = Field(default="from-primary/90 via-primary/70 to-primary/40", max_length=200)
    is_active: bool = True


class HomepageStat(BaseModel):
    value: str = Field(default="", max_length=50)
    label: str = Field(default="", max_length=100)


class HomepageCta(BaseModel):
    title: str = Field(default="", max_length=200)
    subtitle: str = Field(default="", max_length=500)
    note: str = Field(default="", max_length=500)
    primary: HomepageButton = Field(default_factory=HomepageButton)
    secondary: HomepageButton = Field(default_factory=HomepageButton)


class HomepageSection(BaseModel):
    title: str = Field(default="", max_length=200)
    subtitle: str = Field(default="", max_length=500)
    link_label: str = Field(default="", max_length=100)
    is_enabled: bool = True


class HomepageBlock(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    type: Literal["hero", "stats", "performances", "programs", "news", "media", "cta"]
    title: str = Field(default="", max_length=200)
    subtitle: str = Field(default="", max_length=500)
    body: str = ""
    media_url: str = Field(default="", max_length=1000)
    media_type: Literal["auto", "image", "video"] = "auto"
    layout: Literal["default", "media_left", "media_right", "full_bleed"] = "default"
    link: HomepageButton = Field(default_factory=HomepageButton)
    is_enabled: bool = True


class HomepageSections(BaseModel):
    programs: HomepageSection = Field(default_factory=HomepageSection)
    performances: HomepageSection = Field(default_factory=HomepageSection)
    news: HomepageSection = Field(default_factory=HomepageSection)


class HomepageSettings(BaseModel):
    hero_slides: List[HomepageHeroSlide] = Field(default_factory=list)
    stats: List[HomepageStat] = Field(default_factory=list)
    sections: HomepageSections = Field(default_factory=HomepageSections)
    cta: HomepageCta = Field(default_factory=HomepageCta)
    blocks: List[HomepageBlock] = Field(default_factory=list)


class HomepageDraftResponse(BaseModel):
    bundle: "HomepageSettingsBundle"
    is_dirty: bool = False
    published_at: str | None = None


class HomepageSettingsUpdate(HomepageSettings):
    pass


class HomepageSettingsBundle(BaseModel):
    zh: HomepageSettings = Field(default_factory=HomepageSettings)
    en: HomepageSettings = Field(default_factory=HomepageSettings)
    fr: HomepageSettings = Field(default_factory=HomepageSettings)


class HomepageSettingsBundleUpdate(HomepageSettingsBundle):
    pass


HomepageV2BlockType = Literal[
    "hero_carousel",
    "video_hero",
    "media_story",
    "video_player",
    "image_marquee",
    "masonry_gallery",
    "awards_showcase",
    "sponsor_wall",
    "campaign",
    "testimonials",
    "statistics",
    "feature_grid",
    "program_directory",
    "performances",
    "latest_news",
    "timeline",
    "editorial_quote",
    "cta",
]


class HomepageV2LocalizedContent(BaseModel):
    eyebrow: str = Field(default="", max_length=120)
    title: str = Field(default="", max_length=300)
    subtitle: str = Field(default="", max_length=1000)
    body: str = ""
    label: str = Field(default="", max_length=200)
    caption: str = Field(default="", max_length=1000)
    alt_text: str = Field(default="", max_length=500)
    primary_label: str = Field(default="", max_length=120)
    secondary_label: str = Field(default="", max_length=120)
    link_label: str = Field(default="", max_length=120)


class HomepageV2Translations(BaseModel):
    zh: HomepageV2LocalizedContent = Field(default_factory=HomepageV2LocalizedContent)
    en: HomepageV2LocalizedContent = Field(default_factory=HomepageV2LocalizedContent)
    fr: HomepageV2LocalizedContent = Field(default_factory=HomepageV2LocalizedContent)


class HomepageV2Link(BaseModel):
    href: str = Field(default="", max_length=2000)
    new_tab: bool = False


class HomepageV2Schedule(BaseModel):
    start_at: str | None = None
    end_at: str | None = None
    timezone: str = Field(default="America/Toronto", max_length=80)


class HomepageV2Design(BaseModel):
    theme: Literal["white", "soft_lilac", "dark_plum", "transparent"] = "white"
    width: Literal["contained", "wide", "full"] = "contained"
    spacing: Literal["compact", "normal", "spacious"] = "normal"
    alignment: Literal["left", "center", "right"] = "left"
    media_ratio: Literal["auto", "square", "portrait", "landscape", "cinematic"] = "landscape"
    overlay: Literal["none", "light", "medium", "dark"] = "none"


class HomepageV2Behavior(BaseModel):
    animation: Literal["none", "fade_up", "stagger", "reveal", "soft_zoom"] = "fade_up"
    autoplay: bool = False
    loop: bool = False
    speed: Literal["slow", "normal", "fast"] = "normal"


class HomepageV2DataSource(BaseModel):
    source: Literal["none", "programs", "performances", "news"] = "none"
    limit: int = Field(default=6, ge=1, le=24)
    sort: Literal["default", "newest", "oldest", "manual"] = "default"
    category: str = Field(default="", max_length=120)


class HomepageV2Item(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    is_enabled: bool = True
    media_type: Literal["image", "video", "logo", "none"] = "image"
    media_url: str = Field(default="", max_length=2000)
    mobile_url: str = Field(default="", max_length=2000)
    poster_url: str = Field(default="", max_length=2000)
    focal_x: int = Field(default=50, ge=0, le=100)
    focal_y: int = Field(default=50, ge=0, le=100)
    content: HomepageV2Translations = Field(default_factory=HomepageV2Translations)
    link: HomepageV2Link = Field(default_factory=HomepageV2Link)
    schedule: HomepageV2Schedule = Field(default_factory=HomepageV2Schedule)
    meta: Dict[str, Any] = Field(default_factory=dict)


class HomepageV2Block(BaseModel):
    id: str = Field(min_length=1, max_length=100)
    type: HomepageV2BlockType
    schema_version: int = Field(default=1, ge=1, le=10)
    admin_label: str = Field(default="", max_length=200)
    is_enabled: bool = True
    schedule: HomepageV2Schedule = Field(default_factory=HomepageV2Schedule)
    design: HomepageV2Design = Field(default_factory=HomepageV2Design)
    behavior: HomepageV2Behavior = Field(default_factory=HomepageV2Behavior)
    content: HomepageV2Translations = Field(default_factory=HomepageV2Translations)
    items: List[HomepageV2Item] = Field(default_factory=list, max_length=100)
    primary_link: HomepageV2Link = Field(default_factory=HomepageV2Link)
    secondary_link: HomepageV2Link = Field(default_factory=HomepageV2Link)
    data_source: HomepageV2DataSource = Field(default_factory=HomepageV2DataSource)
    config: Dict[str, Any] = Field(default_factory=dict)


class HomepageDocumentV2(BaseModel):
    version: Literal[2] = 2
    blocks: List[HomepageV2Block] = Field(default_factory=list, max_length=100)


class HomepageV2DraftResponse(BaseModel):
    document: HomepageDocumentV2
    is_dirty: bool = False
    published_at: str | None = None
    warnings: List[str] = Field(default_factory=list)


class SchoolPolicyContent(BaseModel):
    title: str = Field(default="", max_length=200)
    body_markdown: str = ""


class SchoolPolicyBundle(BaseModel):
    zh: SchoolPolicyContent = Field(default_factory=SchoolPolicyContent)
    en: SchoolPolicyContent = Field(default_factory=SchoolPolicyContent)
    fr: SchoolPolicyContent = Field(default_factory=SchoolPolicyContent)


class SchoolPolicyBundleUpdate(SchoolPolicyBundle):
    pass


class AiProviderSettings(BaseModel):
    enabled: bool = False
    thinking_enabled: bool = False
    image_enabled: bool = False
    provider: str = Field(default="openai_compatible", max_length=100)
    api_base_url: str = Field(default="https://api.openai.com/v1", max_length=1000)
    model: str = Field(default="", max_length=200)
    timeout_seconds: int = Field(default=600, ge=5, le=900)
    feature_models: dict[str, str] = Field(default_factory=dict)
    api_key_set: bool = False
    api_key_masked: str = ""


class AiProviderSettingsUpdate(BaseModel):
    enabled: bool = False
    thinking_enabled: bool = False
    image_enabled: bool = False
    provider: str = Field(default="openai_compatible", max_length=100)
    api_base_url: str = Field(default="https://api.openai.com/v1", max_length=1000)
    model: str = Field(default="", max_length=200)
    timeout_seconds: int = Field(default=600, ge=5, le=900)
    feature_models: dict[str, str] = Field(default_factory=dict)
    api_key: str | None = Field(default=None, max_length=4000)
    clear_api_key: bool = False
