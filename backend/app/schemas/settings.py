from typing import List, Literal

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
