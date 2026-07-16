import unittest
import json

from app.api.v1.pages import DEFAULTS, _parse_document, _validate_page
from app.models import SystemSettings


class SitePageContractTests(unittest.TestCase):
    def setUp(self):
        self.about = DEFAULTS["about"]
        self.contact = DEFAULTS["contact"]

    def test_defaults_are_publishable(self):
        self.assertEqual(_validate_page(self.about(), SystemSettings(contact_email="info@example.com")), [])
        self.assertEqual(_validate_page(self.contact(), SystemSettings(contact_email="info@example.com")), [])

    def test_defaults_keep_unicode_content(self):
        self.assertEqual(self.about().hero.content.zh.title, "关于我们")
        self.assertEqual(self.about().hero.content.fr.title, "À propos de nous")
        self.assertEqual(self.contact().hero.content.zh.title, "联系我们")

    def test_legacy_contact_form_fields_are_normalized(self):
        page = self.contact()
        form = next(block for block in page.blocks if block.type == "contact_form")
        form.content.zh.name_label = ""
        form.content.zh.primary_label = ""
        form.content.zh.label = "提交表单"
        restored = _parse_document(json.dumps(page.model_dump(mode="json"), ensure_ascii=False), "contact")
        restored_form = next(block for block in restored.blocks if block.type == "contact_form")
        self.assertEqual(restored_form.content.zh.name_label, "姓名")
        self.assertEqual(restored_form.content.zh.primary_label, "提交表单")

    def test_contact_form_requires_valid_recipient(self):
        self.assertIn("contact_email must be valid when the contact form is enabled", _validate_page(self.contact(), SystemSettings(contact_email="invalid")))

    def test_enabled_media_requires_chinese_alt_text(self):
        page = self.about()
        page.blocks[0].image_url = "/static/uploads/about.jpg"
        self.assertIn("about-intro.content.zh.alt_text is required", _validate_page(page, SystemSettings(contact_email="info@example.com")))

    def test_external_and_internal_links(self):
        page = self.about()
        page.blocks[0].href = "javascript:alert(1)"
        self.assertIn("about-intro.href is invalid", _validate_page(page, SystemSettings(contact_email="info@example.com")))

    def test_missing_secondary_translation_is_a_warning(self):
        page = self.about()
        page.blocks[0].content.en.title = ""
        self.assertNotIn("about-intro.content.en.title is missing", _validate_page(page, SystemSettings(contact_email="info@example.com")))


if __name__ == "__main__":
    unittest.main()
