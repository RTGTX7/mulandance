import unittest

from app.api.v1.settings import (
    _homepage_defaults,
    _legacy_homepage_to_v2,
    _public_homepage_v2,
    _validate_homepage_v2,
)
from app.schemas.settings import (
    HomepageDocumentV2,
    HomepageSettingsBundle,
    HomepageV2Block,
    HomepageV2Item,
)


class HomepageV2Tests(unittest.TestCase):
    def legacy_bundle(self):
        return HomepageSettingsBundle(
            zh=_homepage_defaults("zh"),
            en=_homepage_defaults("en"),
            fr=_homepage_defaults("fr"),
        )

    def test_legacy_conversion_preserves_structure_and_locales(self):
        document = _legacy_homepage_to_v2(self.legacy_bundle())
        self.assertEqual(document.version, 2)
        self.assertEqual(document.blocks[0].type, "hero_carousel")
        self.assertTrue(document.blocks[0].items)
        self.assertTrue(document.blocks[0].items[0].content.zh.title)
        self.assertTrue(document.blocks[0].items[0].content.en.title)
        self.assertTrue(document.blocks[0].items[0].content.fr.title)
        self.assertIn("program_directory", [block.type for block in document.blocks])

    def test_public_document_filters_disabled_and_scheduled_content(self):
        hero = HomepageV2Block(
            id="hero",
            type="hero_carousel",
            items=[HomepageV2Item(id="visible"), HomepageV2Item(id="hidden", is_enabled=False)],
        )
        future = HomepageV2Block(
            id="future",
            type="cta",
            schedule={"start_at": "2099-01-01T00:00", "timezone": "America/Toronto"},
        )
        disabled = HomepageV2Block(id="disabled", type="cta", is_enabled=False)
        public = _public_homepage_v2(HomepageDocumentV2(blocks=[hero, future, disabled]))
        self.assertEqual([block.id for block in public.blocks], ["hero"])
        self.assertEqual([item.id for item in public.blocks[0].items], ["visible"])

    def test_publish_requires_hero_first_and_video_poster(self):
        invalid_order = HomepageDocumentV2(blocks=[HomepageV2Block(id="cta", type="cta")])
        errors, _ = _validate_homepage_v2(invalid_order)
        self.assertTrue(any("first enabled" in error for error in errors))

        video = HomepageV2Block(
            id="video",
            type="video_hero",
            items=[HomepageV2Item(id="video-item", media_type="video", media_url="/video.mp4")],
        )
        errors, _ = _validate_homepage_v2(HomepageDocumentV2(blocks=[video]))
        self.assertTrue(any("poster" in error for error in errors))

    def test_invalid_external_link_is_rejected(self):
        hero = HomepageV2Block(
            id="hero",
            type="hero_carousel",
            items=[HomepageV2Item(id="slide")],
            primary_link={"href": "javascript:alert(1)"},
        )
        errors, _ = _validate_homepage_v2(HomepageDocumentV2(blocks=[hero]))
        self.assertTrue(any("invalid link" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
