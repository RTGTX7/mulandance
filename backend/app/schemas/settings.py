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
    youtube_url: str = Field(default="https://www.youtube.com/@mulandancestudio21", max_length=1000)
    xiaohongshu_url: str = Field(default="https://www.rednote.com/user/profile/5b8ab7c50ddda30001575476", max_length=1000)
    instagram_url: str = Field(default="", max_length=1000)
    facebook_url: str = Field(default="", max_length=1000)
    tiktok_url: str = Field(default="", max_length=1000)


class SystemSettingsResponse(SystemSettingsBase):
    pass


class SystemSettingsUpdate(SystemSettingsBase):
    pass
