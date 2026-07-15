import logging
import os
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine
from app.models import Base

logger = logging.getLogger(__name__)


def _ensure_data_directories():
    """Ensure all data directories exist and are not wiped by code changes."""
    base_dir = Path(settings.DATA_DIR)
    dirs = {
        "news": Path(settings.NEWS_FILES_DIR),
        "uploads": Path(settings.UPLOADS_DIR),
        "pages": base_dir / "pages",
        "backups": base_dir / "backups",
    }
    for name, path in dirs.items():
        path.mkdir(parents=True, exist_ok=True)
        # Create .gitkeep if it doesn't exist
        gitkeep = path / ".gitkeep"
        if not gitkeep.exists():
            gitkeep.touch()
        logger.info(f"Ensured directory exists: {path}")


def _ensure_database_tables():
    """Create any missing database tables on startup.
    
    This is idempotent and safe to call every time the app starts.
    It will only create tables that don't already exist.
    Existing data is NEVER touched or overwritten.
    """
    from sqlalchemy import inspect as sql_inspect

    inspector = sql_inspect(engine)
    existing_tables = set(inspector.get_table_names())
    metadata_tables = set(Base.metadata.tables.keys())
    missing_tables = metadata_tables - existing_tables

    if missing_tables:
        logger.warning(
            f"Creating {len(missing_tables)} missing table(s): {sorted(missing_tables)}"
        )
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")
    else:
        logger.info("All database tables already exist.")

    # Log all tables for debugging
    all_tables = sorted(existing_tables | missing_tables)
    logger.info(f"Database has {len(all_tables)} table(s): {all_tables}")


def _migrate_article_groups_if_needed():
    """Run article_groups migration if tables are missing data.
    
    This checks if article_groups tables exist but are empty (no migrated data),
    and runs the migration from news_articles if needed.
    """
    import uuid
    from sqlalchemy import text

    conn = engine.connect()
    try:
        # Check if article_groups table exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='article_groups'"
        ))
        if result.fetchone() is None:
            # article_groups doesn't exist at all - migration needed
            logger.warning("article_groups table missing, running migration...")
            conn.close()
            _run_article_migration()
            return

        # Check if migration was already done
        group_count = conn.execute(text("SELECT COUNT(*) FROM article_groups")).scalar()
        if group_count > 0:
            logger.info(f"Article groups already migrated ({group_count} groups).")
            return

        # Tables exist but empty - check if we have articles to migrate
        article_count = conn.execute(text("SELECT COUNT(*) FROM news_articles")).scalar()
        if article_count > 0:
            logger.info(f"Found {article_count} articles to migrate to article_groups...")
            conn.close()
            _run_article_migration()
        else:
            logger.info("No articles to migrate.")
    except Exception as e:
        logger.error(f"Migration check error: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


def _ensure_article_group_source_url_column():
    """Add article_groups.source_url for imported-article deduplication when missing."""
    from sqlalchemy import text

    conn = engine.connect()
    try:
        exists = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='article_groups'"
        )).fetchone()
        if not exists:
            return

        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(article_groups)")).fetchall()]
        if "source_url" not in columns:
            logger.warning("Adding missing article_groups.source_url column...")
            conn.execute(text("ALTER TABLE article_groups ADD COLUMN source_url TEXT"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_article_groups_source_url ON article_groups(source_url)"))
            logger.info("article_groups.source_url column added.")
        if "show_on_homepage" not in columns:
            logger.warning("Adding missing article_groups.show_on_homepage column...")
            conn.execute(text("ALTER TABLE article_groups ADD COLUMN show_on_homepage BOOLEAN NOT NULL DEFAULT 1"))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed ensuring article_groups.source_url column: {e}")
    finally:
        try:
            conn.close()
        except Exception:
            pass


def _run_article_migration():
    """Migrate articles from news_articles to article_groups + article_translations.
    
    This is a simplified inline version of migrate_article_groups.py
    that runs safely on startup.
    """
    import uuid
    from sqlalchemy import text
    from datetime import datetime, timezone

    conn = engine.connect()
    now = datetime.now(timezone.utc).isoformat()

    try:
        # Create article_groups table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_groups (
                id TEXT PRIMARY KEY,
                shared_slug TEXT NOT NULL UNIQUE,
                created_at DATETIME,
                updated_at DATETIME
            )
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_article_groups_shared_slug ON article_groups(shared_slug)"
        ))

        # Create article_group_categories table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_group_categories (
                group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
                category_id TEXT NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
                PRIMARY KEY (group_id, category_id)
            )
        """))

        # Create article_group_tags table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_group_tags (
                group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
                tag_id TEXT NOT NULL REFERENCES news_tags(id) ON DELETE CASCADE,
                PRIMARY KEY (group_id, tag_id)
            )
        """))

        # Create article_translations table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS article_translations (
                id TEXT PRIMARY KEY,
                group_id TEXT NOT NULL REFERENCES article_groups(id) ON DELETE CASCADE,
                locale TEXT NOT NULL DEFAULT 'en',
                slug TEXT NOT NULL,
                title TEXT NOT NULL,
                summary TEXT,
                body TEXT,
                author_id TEXT REFERENCES users(id),
                published_at DATETIME,
                cover_image TEXT,
                is_published INTEGER DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            )
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_article_translations_group_id ON article_translations(group_id)"
        ))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_article_translations_slug ON article_translations(slug)"
        ))

        conn.commit()

        # Check if already migrated
        group_count = conn.execute(text("SELECT COUNT(*) FROM article_groups")).scalar()
        if group_count > 0:
            logger.info(f"Articles already migrated ({group_count} groups). Skipping.")
            return

        # Get article columns
        columns_result = conn.execute(text("PRAGMA table_info(news_articles)"))
        columns = [row[1] for row in columns_result.fetchall()]
        has_updated_at = "updated_at" in columns

        base_cols = "id, slug, title, summary, body, author_id, published_at, cover_image, is_published, locale, created_at"
        if has_updated_at:
            base_cols += ", updated_at"

        articles_result = conn.execute(text(f"SELECT {base_cols} FROM news_articles")).fetchall()
        
        if not articles_result:
            logger.info("No articles to migrate.")
            return

        article_list = [dict(zip(columns, row)) for row in articles_result]
        migrated = 0

        for article in article_list:
            group_id = str(uuid.uuid4())

            conn.execute(text("""
                INSERT INTO article_groups (id, shared_slug, created_at, updated_at)
                VALUES (:id, :slug, :created_at, :updated_at)
            """), {
                "id": group_id,
                "slug": article["slug"],
                "created_at": article["created_at"] or now,
                "updated_at": article.get("updated_at") or now,
            })

            conn.execute(text("""
                INSERT INTO article_translations (
                    id, group_id, locale, slug, title, summary, body,
                    author_id, published_at, cover_image, is_published, created_at, updated_at
                ) VALUES (
                    :id, :group_id, :locale, :slug, :title, :summary, :body,
                    :author_id, :published_at, :cover_image, :is_published, :created_at, :updated_at
                )
            """), {
                "id": article["id"],
                "group_id": group_id,
                "locale": article.get("locale") or "en",
                "slug": article["slug"],
                "title": article["title"],
                "summary": article.get("summary"),
                "body": article.get("body"),
                "author_id": article.get("author_id"),
                "published_at": article.get("published_at"),
                "cover_image": article.get("cover_image"),
                "is_published": 1 if article.get("is_published") else 0,
                "created_at": article["created_at"] or now,
                "updated_at": article.get("updated_at") or now,
            })

            migrated += 1

        # Migrate category links
        cat_links = conn.execute(text(
            "SELECT article_id, category_id FROM news_article_categories"
        )).fetchall()

        group_id_map = {a["id"]: str(uuid.uuid4()) for a in article_list}
        # Actually use the group IDs we just inserted
        group_rows = conn.execute(text(
            "SELECT id, shared_slug FROM article_groups"
        )).fetchall()
        group_id_map = {row["shared_slug"]: row["id"] for row in group_rows}

        # Re-fetch articles to rebuild mapping
        for article in article_list:
            group_rows2 = conn.execute(text(
                "SELECT id FROM article_groups WHERE shared_slug = :slug"
            ), {"slug": article["slug"]}).fetchone()
            group_id_map[article["id"]] = group_rows2["id"]

        cat_migrated = 0
        for link in cat_links:
            old_id = link["article_id"]
            if old_id in group_id_map:
                try:
                    conn.execute(text("""
                        INSERT OR IGNORE INTO article_group_categories (group_id, category_id)
                        VALUES (:group_id, :category_id)
                    """), {
                        "group_id": group_id_map[old_id],
                        "category_id": link["category_id"],
                    })
                    cat_migrated += 1
                except Exception:
                    pass

        # Migrate tag links
        tag_links = conn.execute(text(
            "SELECT article_id, tag_id FROM news_article_tags"
        )).fetchall()

        tag_migrated = 0
        for link in tag_links:
            old_id = link["article_id"]
            if old_id in group_id_map:
                try:
                    conn.execute(text("""
                        INSERT OR IGNORE INTO article_group_tags (group_id, tag_id)
                        VALUES (:group_id, :tag_id)
                    """), {
                        "group_id": group_id_map[old_id],
                        "tag_id": link["tag_id"],
                    })
                    tag_migrated += 1
                except Exception:
                    pass

        conn.commit()
        logger.info(
            f"Migration complete: {migrated} articles -> article_groups, "
            f"{cat_migrated} category links, {tag_migrated} tag links"
        )
    except Exception as e:
        logger.error(f"Article migration failed: {e}", exc_info=True)
        conn.rollback()
        raise

def _migrate_programs_if_needed():
    """Add editable program fields and seed default programs when empty."""
    from sqlalchemy import text
    import json
    import uuid

    defaults = [
        ("chinese", "Chinese Dance", "Classical and folk Chinese dance training for different ages and levels.", "dance", "All levels", "/programs/chinese-dance.jpg", 10),
        ("folk", "Folk Dance", "Folk dance classes that build rhythm, culture, and stage confidence.", "dance", "All levels", "/programs/chinese-dance.jpg", 20),
        ("ballet", "Ballet", "Structured ballet training focused on technique, posture, musicality, and strength.", "dance", "Children, teens, adults", "/programs/ballet.jpg", 30),
        ("contemporary", "Contemporary", "Contemporary dance training with technique, improvisation, and creative movement.", "dance", "Beginner to advanced", "/programs/ballet.jpg", 40),
        ("jazz", "Jazz", "Jazz dance classes with energy, flexibility, musicality, and performance skills.", "dance", "Beginner to advanced", "/programs/ballet.jpg", 50),
        ("hip-hop", "Hip-Hop", "Street dance training covering foundations, groove, choreography, and freestyle.", "dance", "Beginner to advanced", "/programs/chinese-dance.jpg", 60),
        ("summer-camps", "Summer Camps", "Seasonal camp programs with dance training, activities, and performance opportunities.", "camp", "Ages 5+", "/programs/chinese-dance.jpg", 70),
    ]

    conn = engine.connect()
    try:
        table_exists = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='programs'"
        )).fetchone()
        if table_exists is None:
            return

        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(programs)")).fetchall()}
        if "cover_image" not in columns:
            conn.execute(text("ALTER TABLE programs ADD COLUMN cover_image VARCHAR(1000)"))
        if "order_index" not in columns:
            conn.execute(text("ALTER TABLE programs ADD COLUMN order_index INTEGER DEFAULT 0"))
        if "translations_json" not in columns:
            conn.execute(text("ALTER TABLE programs ADD COLUMN translations_json TEXT"))

        program_count = conn.execute(text("SELECT COUNT(*) FROM programs")).scalar()
        if program_count == 0:
            for slug, name, description, category, level, cover_image, order_index in defaults:
                conn.execute(text("""
                    INSERT INTO programs (
                        id, slug, name, description, category, level,
                        cover_image, order_index, is_active, created_at
                    )
                    VALUES (
                        :id, :slug, :name, :description, :category, :level,
                        :cover_image, :order_index, 1, CURRENT_TIMESTAMP
                    )
                """), {
                    "id": str(uuid.uuid4()),
                    "slug": slug,
                    "name": name,
                    "description": description,
                    "category": category,
                    "level": level,
                    "cover_image": cover_image,
                    "order_index": order_index,
                })

        # Previous seeded records reference images that were never included in
        # the deployed public assets. Preserve uploads, changing only legacy
        # built-in paths that would otherwise return 404.
        for slug, legacy_image, cover_image in [
            ("folk", "/programs/folk-dance.jpg", "/programs/chinese-dance.jpg"),
            ("contemporary", "/programs/contemporary.jpg", "/programs/ballet.jpg"),
            ("jazz", "/programs/jazz.jpg", "/programs/ballet.jpg"),
            ("hip-hop", "/programs/hip-hop.jpg", "/programs/chinese-dance.jpg"),
            ("summer-camps", "/programs/summer-camps.jpg", "/programs/chinese-dance.jpg"),
        ]:
            conn.execute(
                text("UPDATE programs SET cover_image = :cover_image WHERE slug = :slug AND cover_image = :legacy_image"),
                {"slug": slug, "legacy_image": legacy_image, "cover_image": cover_image},
            )

        # Old built-in records predate the multilingual content fields. These
        # defaults are applied only while the translation bundle is empty; any
        # content subsequently maintained in the admin is left untouched.
        default_translations = {
            "chinese": {
                "zh": {"name": "中国古典舞", "description": "系统学习中国古典舞与民族民间舞，感受传统文化与舞蹈艺术。", "category": "舞蹈", "level": "所有级别"},
                "en": {"name": "Classical Chinese Dance", "description": "Training in classical and folk Chinese dance for dancers of different ages and levels.", "category": "Dance", "level": "All levels"},
                "fr": {"name": "Danse classique chinoise", "description": "Formation en danse classique et folklorique chinoise pour differents ages et niveaux.", "category": "Danse", "level": "Tous les niveaux"},
            },
            "folk": {
                "zh": {"name": "中国民族民间舞", "description": "学习不同地域的民族民间舞风格，培养节奏感、文化理解和舞台表现力。", "category": "舞蹈", "level": "所有级别"},
                "en": {"name": "Chinese Folk Dance", "description": "Folk dance classes that build rhythm, cultural understanding, and stage confidence.", "category": "Dance", "level": "All levels"},
                "fr": {"name": "Danse folklorique chinoise", "description": "Cours de danse folklorique qui developpent le rythme, la culture et la confiance sur scene.", "category": "Danse", "level": "Tous les niveaux"},
            },
            "ballet": {
                "zh": {"name": "芭蕾舞", "description": "以技巧、体态、乐感和力量为重点的系统芭蕾训练。", "category": "舞蹈", "level": "儿童、青少年及成人"},
                "en": {"name": "Ballet", "description": "Structured ballet training focused on technique, posture, musicality, and strength.", "category": "Dance", "level": "Children, teens, adults"},
                "fr": {"name": "Ballet", "description": "Formation structuree en ballet axee sur la technique, la posture, la musicalite et la force.", "category": "Danse", "level": "Enfants, adolescents et adultes"},
            },
            "contemporary": {
                "zh": {"name": "现代舞", "description": "通过技巧、即兴和创意动作探索现代舞表达。", "category": "舞蹈", "level": "初级至高级"},
                "en": {"name": "Contemporary", "description": "Contemporary dance training with technique, improvisation, and creative movement.", "category": "Dance", "level": "Beginner to advanced"},
                "fr": {"name": "Danse contemporaine", "description": "Formation en danse contemporaine avec technique, improvisation et mouvement creatif.", "category": "Danse", "level": "Debutant a avance"},
            },
            "jazz": {
                "zh": {"name": "爵士舞", "description": "充满活力的爵士舞课程，训练柔韧性、乐感和舞台表现力。", "category": "舞蹈", "level": "初级至高级"},
                "en": {"name": "Jazz", "description": "Jazz dance classes with energy, flexibility, musicality, and performance skills.", "category": "Dance", "level": "Beginner to advanced"},
                "fr": {"name": "Jazz", "description": "Cours de jazz dynamiques developpant souplesse, musicalite et presence scenique.", "category": "Danse", "level": "Debutant a avance"},
            },
            "hip-hop": {
                "zh": {"name": "街舞", "description": "学习街舞基础、律动、编舞与自由舞。", "category": "舞蹈", "level": "初级至高级"},
                "en": {"name": "Hip-Hop", "description": "Street dance training covering foundations, groove, choreography, and freestyle.", "category": "Dance", "level": "Beginner to advanced"},
                "fr": {"name": "Hip-Hop", "description": "Formation en danse urbaine couvrant les bases, le groove, la choregraphie et le freestyle.", "category": "Danse", "level": "Debutant a avance"},
            },
            "summer-camps": {
                "zh": {"name": "暑期夏令营", "description": "假期中的舞蹈强化课程，包含训练、活动与展示机会。", "category": "夏令营", "level": "5岁及以上"},
                "en": {"name": "Summer Camps", "description": "Seasonal camp programs with dance training, activities, and performance opportunities.", "category": "Camp", "level": "Ages 5+"},
                "fr": {"name": "Camps d'ete", "description": "Programmes saisonniers avec formation en danse, activites et occasions de spectacle.", "category": "Camp", "level": "5 ans et plus"},
            },
        }
        for slug, translations in default_translations.items():
            conn.execute(
                text("UPDATE programs SET translations_json = :translations WHERE slug = :slug AND (translations_json IS NULL OR translations_json IN ('', '{}'))"),
                {"slug": slug, "translations": json.dumps(translations, ensure_ascii=False)},
            )

        conn.commit()
    except Exception as e:
        logger.error(f"Program migration failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_system_settings_if_needed():
    """Add newer settings columns to existing SQLite databases."""
    from sqlalchemy import text
    import json

    conn = engine.connect()
    try:
        table_exists = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='system_settings'"
        )).fetchone()
        if table_exists is None:
            return

        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(system_settings)")).fetchall()}
        if "outbound_email" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN outbound_email VARCHAR(255) DEFAULT ''"))
        if "classroom_request_limit_per_contact" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN classroom_request_limit_per_contact INTEGER DEFAULT 0"))
        if "program_pricing_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN program_pricing_json TEXT DEFAULT ''"))
        if "classroom_pricing_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN classroom_pricing_json TEXT DEFAULT ''"))
        if "homepage_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN homepage_json TEXT"))
        if "homepage_draft_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN homepage_draft_json TEXT"))
        if "homepage_v2_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN homepage_v2_json TEXT"))
        if "homepage_v2_draft_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN homepage_v2_draft_json TEXT"))
        if "homepage_published_at" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN homepage_published_at DATETIME"))
        if "site_draft_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN site_draft_json TEXT"))
        if "site_published_at" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN site_published_at DATETIME"))
        if "ai_enabled" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_enabled INTEGER DEFAULT 0"))
        if "ai_thinking_enabled" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_thinking_enabled INTEGER DEFAULT 0"))
        if "ai_image_enabled" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_image_enabled INTEGER DEFAULT 0"))
        if "ai_provider" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_provider VARCHAR(100) DEFAULT 'openai_compatible'"))
        if "ai_api_base_url" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_api_base_url VARCHAR(1000) DEFAULT 'https://api.openai.com/v1'"))
        if "ai_api_key" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_api_key TEXT DEFAULT ''"))
        if "ai_model" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_model VARCHAR(200) DEFAULT ''"))
        if "ai_timeout_seconds" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_timeout_seconds INTEGER DEFAULT 600"))
        if "translations_json" not in columns:
            conn.execute(text("ALTER TABLE system_settings ADD COLUMN translations_json TEXT"))

        # Existing installations may have a single-language settings record
        # from before the multilingual settings editor existed. Seed only an
        # empty translation bundle, never overwriting maintained copy.
        system_translations = {
            "zh": {
                "site_name": "木兰舞蹈工作室",
                "header_cta_label": "立即报名",
                "footer_newsletter_title": "加入我们",
                "copyright_text": "版权所有。",
            },
            "en": {
                "site_name": "Mulan Dance Studio",
                "header_cta_label": "Register",
                "footer_newsletter_title": "Join Us",
                "copyright_text": "All rights reserved.",
            },
            "fr": {
                "site_name": "Mulan Dance Studio",
                "header_cta_label": "Inscrivez-vous",
                "footer_newsletter_title": "Rejoignez-nous",
                "copyright_text": "Tous droits reserves.",
            },
        }
        raw_translations = conn.execute(
            text("SELECT translations_json FROM system_settings WHERE id = 1")
        ).scalar()
        try:
            saved_translations = json.loads(raw_translations or "{}")
        except (TypeError, ValueError):
            saved_translations = {}
        if not isinstance(saved_translations, dict):
            saved_translations = {}
        translations_changed = False
        for locale, defaults in system_translations.items():
            saved_locale = saved_translations.get(locale)
            if not isinstance(saved_locale, dict):
                saved_locale = {}
                saved_translations[locale] = saved_locale
                translations_changed = True
            for field, value in defaults.items():
                if saved_locale.get(field) in (None, ""):
                    saved_locale[field] = value
                    translations_changed = True
        if translations_changed:
            conn.execute(
                text("UPDATE system_settings SET translations_json = :translations WHERE id = 1"),
                {"translations": json.dumps(saved_translations, ensure_ascii=False)},
            )
        conn.commit()
    except Exception as e:
        logger.error(f"System settings migration failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_admin_roles_if_needed():
    """Collapse legacy backend roles into super_admin/admin."""
    from sqlalchemy import text

    conn = engine.connect()
    try:
        table_exists = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )).fetchone()
        if table_exists is None:
            return

        super_count = conn.execute(text(
            "SELECT COUNT(*) FROM users WHERE role = 'super_admin'"
        )).scalar()
        if super_count == 0:
            first_admin = conn.execute(text("""
                SELECT id FROM users
                WHERE role IN ('admin', 'editor', 'faculty')
                ORDER BY
                    CASE WHEN email = 'admin@mulandance.com' THEN 0 ELSE 1 END,
                    created_at ASC
                LIMIT 1
            """)).fetchone()
            if first_admin:
                conn.execute(text(
                    "UPDATE users SET role = 'super_admin' WHERE id = :id"
                ), {"id": first_admin[0]})

        conn.execute(text(
            "UPDATE users SET role = 'admin' WHERE role IN ('editor', 'faculty')"
        ))
        conn.commit()
    except Exception as e:
        logger.error(f"Admin role migration failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_multilingual_nicknames_if_needed():
    """Add localized teacher nicknames while preserving the legacy nickname."""
    from sqlalchemy import text

    conn = engine.connect()
    try:
        exists = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='user_profiles'"
        )).fetchone()
        if not exists:
            return
        columns = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(user_profiles)")).fetchall()
        }
        for name in ("nickname_zh", "nickname_en", "nickname_fr"):
            if name not in columns:
                conn.execute(text(f"ALTER TABLE user_profiles ADD COLUMN {name} VARCHAR(100)"))
        conn.execute(text(
            "UPDATE user_profiles SET nickname_zh = first_name "
            "WHERE nickname_zh IS NULL OR trim(nickname_zh) = ''"
        ))
        conn.commit()
    except Exception as exc:
        logger.error(f"Multilingual nickname migration failed: {exc}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_faculty_account_link_if_needed():
    """Allow one public faculty profile to be owned by one teacher account."""
    from sqlalchemy import text
    conn = engine.connect()
    try:
        exists = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='faculty_members'")).fetchone()
        if not exists:
            return
        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(faculty_members)")).fetchall()}
        if "user_id" not in columns:
            conn.execute(text("ALTER TABLE faculty_members ADD COLUMN user_id VARCHAR(36)"))
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_faculty_members_user_id ON faculty_members(user_id)"))
            conn.commit()
    except Exception as exc:
        logger.error(f"Faculty account-link migration failed: {exc}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_pricing_catalogs_if_needed():
    """Create the structured pricing catalogs once, preserving saved legacy JSON."""
    import json
    from decimal import Decimal, InvalidOperation
    from app.core.database import SessionLocal
    from app.core.translations import parse_translations, set_translation_bundle
    from app.models import (
        PricingCatalog, PricingContentBlock, PricingOption, PricingPlan,
        Studio, StudioRoom, SystemSettings,
    )

    db = SessionLocal()
    try:
        if db.query(PricingCatalog).count():
            return
        settings_row = db.query(SystemSettings).first()
        settings_translations = parse_translations(getattr(settings_row, "translations_json", None)) if settings_row else {}

        def parse_value(raw, fallback):
            try:
                value = json.loads(raw or "")
                return value if isinstance(value, (dict, list)) else fallback
            except (TypeError, ValueError):
                return fallback

        program_default = {
            "table": {"programLabel": "Program / Plan", "column1Label": "Unit Price", "column2Label": "Total Price", "column3Label": "Validity / Notes"},
            "items": [
                {"program": "Package A / 80 Hours", "column1Currency": "CAD", "column1Value": "15", "column2Currency": "CAD", "column2Value": "1356", "column3Value": "Valid for 548 days after the first class. 50% deposit, balance due within 1 month of program start."},
                {"program": "Package B / 40 Hours", "column1Currency": "CAD", "column1Value": "17", "column2Currency": "CAD", "column2Value": "768.4", "column3Value": "Valid for 365 days after the first class. 50% deposit, balance due within 2 weeks of program start."},
                {"program": "Package C / 16 Hours", "column1Currency": "CAD", "column1Value": "20", "column2Currency": "CAD", "column2Value": "361.6", "column3Value": "Valid for 182 days after the first class. Full payment required at purchase."},
                {"program": "Package D / 120 Hours", "column1Currency": "CAD", "column1Value": "14", "column2Currency": "CAD", "column2Value": "1898.4", "column3Value": "Valid for 365 days after the first class. 50% deposit, balance due within 1 month of program start."},
                {"program": "Single Class", "column1Currency": "CAD", "column1Value": "30", "column2Currency": "", "column2Value": "", "column3Value": "Class price scales by class duration."},
            ],
            "infoCards": [
                {"title": "Financial Aid Available", "body": "Families can contact the studio to ask about available support options."},
                {"title": "Flexible Packages", "body": "Packages can cover class hours, term bundles, memberships, or single classes."},
                {"title": "Confirm Class Length", "body": "Class duration may vary by group; confirm how hours are counted before purchase."},
            ],
            "payment": {"title": "Payment & Usage Notes", "columns": [
                {"title": "Accepted Methods", "items": ["Credit or debit card", "Bank transfer", "Cash or cheque at the studio"]},
                {"title": "Before Purchase", "items": ["Confirm package validity", "Confirm installment dates", "Confirm how class duration uses package hours"]},
            ]},
        }
        program_sources = {}
        base_program = parse_value(getattr(settings_row, "program_pricing_json", "") if settings_row else "", program_default)
        for locale in ("zh", "en", "fr"):
            raw = settings_translations.get(locale, {}).get("program_pricing_json", "")
            program_sources[locale] = parse_value(raw, base_program)
        program_catalog = PricingCatalog(kind="program", title="课程价格", subtitle="选择适合学习安排的课程或课时方案。", is_dirty=False)
        set_translation_bundle(program_catalog, {
            "zh": {"title": "课程价格", "subtitle": "选择适合学习安排的课程或课时方案。"},
            "en": {"title": "Program Pricing", "subtitle": "Choose a class or hour package that fits your training."},
            "fr": {"title": "Tarifs des cours", "subtitle": "Choisissez un cours ou un forfait adapté à votre formation."},
        })
        db.add(program_catalog); db.flush()

        def decimal_value(value):
            text_value = str(value or "").replace(",", "").strip()
            try: return Decimal(text_value)
            except (InvalidOperation, ValueError): return None

        base_items = base_program.get("items", []) if isinstance(base_program, dict) else []
        for index, raw_item in enumerate(base_items):
            if not isinstance(raw_item, dict): continue
            title = str(raw_item.get("program") or "")
            detail = str(raw_item.get("column3Value") or raw_item.get("hours") or "")
            plan = PricingPlan(catalog_id=program_catalog.id, title=title, description="", badge="", details_json=json.dumps([detail] if detail else [], ensure_ascii=False), is_active=True, is_featured=index == 0, sort_order=index)
            translations = {}
            for locale, source in program_sources.items():
                localized_items = source.get("items", []) if isinstance(source, dict) else []
                localized_item = localized_items[index] if index < len(localized_items) and isinstance(localized_items[index], dict) else raw_item
                localized_detail = str(localized_item.get("column3Value") or localized_item.get("hours") or "")
                translations[locale] = {"title": str(localized_item.get("program") or title), "description": "", "badge": "", "details": [localized_detail] if localized_detail else []}
            set_translation_bundle(plan, translations); db.add(plan); db.flush()
            table = base_program.get("table", {}) if isinstance(base_program, dict) else {}
            price_specs = [
                ("column1Value", "column1Currency", str(table.get("column1Label") or "Unit Price")),
                ("column2Value", "column2Currency", str(table.get("column2Label") or "Total Price")),
            ]
            option_index = 0
            for value_key, currency_key, label in price_specs:
                amount = decimal_value(raw_item.get(value_key))
                if amount is None or amount <= 0: continue
                currency_raw = str(raw_item.get(currency_key) or "CAD").upper().replace("$", "CAD")
                currency = currency_raw if len(currency_raw) == 3 else "CAD"
                option = PricingOption(plan_id=plan.id, label=label, amount=amount, currency=currency, unit="", note="", sort_order=option_index)
                option_translations = {}
                for locale, source in program_sources.items():
                    localized_table = source.get("table", {}) if isinstance(source, dict) else {}
                    option_translations[locale] = {"label": str(localized_table.get("column1Label" if value_key == "column1Value" else "column2Label") or label), "unit": "", "note": ""}
                set_translation_bundle(option, option_translations); db.add(option); option_index += 1

        blocks = []
        if isinstance(base_program, dict):
            blocks.extend(("info", item) for item in base_program.get("infoCards", []) if isinstance(item, dict))
            payment = base_program.get("payment", {})
            blocks.extend(("payment", item) for item in payment.get("columns", []) if isinstance(item, dict))
        for index, (block_type, item) in enumerate(blocks):
            block = PricingContentBlock(catalog_id=program_catalog.id, block_type=block_type, title=str(item.get("title") or ""), body=str(item.get("body") or ""), items_json=json.dumps(item.get("items") or [], ensure_ascii=False), is_active=True, sort_order=index)
            set_translation_bundle(block, {locale: {"title": block.title, "body": block.body, "items": item.get("items") or []} for locale in ("zh", "en", "fr")}); db.add(block)

        rental_default = {"items": [
            {"image_url": "", "hourlyCurrency": "CAD", "hourlyPrice": "80", "hourlyTime": "hour", "halfDayCurrency": "CAD", "halfDayPrice": "280", "halfDayTime": "4 hours", "fullDayCurrency": "CAD", "fullDayPrice": "520", "fullDayTime": "day"},
            {"image_url": "", "hourlyCurrency": "CAD", "hourlyPrice": "45", "hourlyTime": "hour", "halfDayCurrency": "CAD", "halfDayPrice": "160", "halfDayTime": "4 hours", "fullDayCurrency": "CAD", "fullDayPrice": "300", "fullDayTime": "day"},
        ], "notes": {"title": "Before You Book", "items": ["Submitting a request does not guarantee a room.", "Payment is required to reserve a room."]}}
        base_rental = parse_value(getattr(settings_row, "classroom_pricing_json", "") if settings_row else "", rental_default)
        rental_sources = {}
        for locale in ("zh", "en", "fr"):
            raw = settings_translations.get(locale, {}).get("classroom_pricing_json", "")
            rental_sources[locale] = parse_value(raw, base_rental)

        rental_catalog = PricingCatalog(kind="rental", title="教室租赁价格", subtitle="查看可出租教室的价格并提交租赁申请。", is_dirty=True)
        set_translation_bundle(rental_catalog, {
            "zh": {"title": "教室租赁价格", "subtitle": "查看可出租教室的价格并提交租赁申请。"},
            "en": {"title": "Rental Pricing", "subtitle": "Review studio rates before submitting a rental request."},
            "fr": {"title": "Tarifs de location", "subtitle": "Consultez les tarifs avant d’envoyer une demande."},
        })
        db.add(rental_catalog); db.flush()
        rentable_rooms = db.query(StudioRoom).join(Studio, Studio.id == StudioRoom.studio_id).filter(StudioRoom.is_active.is_(True), StudioRoom.is_rentable.is_(True), Studio.is_active.is_(True)).order_by(StudioRoom.sort_order, StudioRoom.name).all()
        for index, room in enumerate(rentable_rooms):
            rental_items = base_rental.get("items", []) if isinstance(base_rental, dict) else []
            raw_item = rental_items[min(index, len(rental_items) - 1)] if rental_items else rental_default["items"][min(index, 1)]
            hourly = str(raw_item.get("hourlyPrice") or "0")
            half_day = str(raw_item.get("halfDayPrice") or "0")
            full_day = str(raw_item.get("fullDayPrice") or "0")
            plan = PricingPlan(catalog_id=rental_catalog.id, room_id=room.id, title=room.name, description="", image_url=str(raw_item.get("image_url") or raw_item.get("imageUrl") or ""), details_json="[]", is_active=True, is_featured=index == 0, sort_order=index)
            set_translation_bundle(plan, {locale: {"title": room.name, "description": "", "badge": "", "details": []} for locale in ("zh", "en", "fr")}); db.add(plan); db.flush()
            labels = [
                ("Hourly", hourly, str(raw_item.get("hourlyTime") or "hour"), str(raw_item.get("hourlyCurrency") or "CAD")),
                ("Half day", half_day, str(raw_item.get("halfDayTime") or "4 hours"), str(raw_item.get("halfDayCurrency") or "CAD")),
                ("Full day", full_day, str(raw_item.get("fullDayTime") or "day"), str(raw_item.get("fullDayCurrency") or "CAD")),
            ]
            translated_labels = {"zh": [("每小时", "小时"), ("半天", "4 小时"), ("全天", "天")], "en": [("Hourly", "hour"), ("Half day", "4 hours"), ("Full day", "day")], "fr": [("À l’heure", "heure"), ("Demi-journée", "4 heures"), ("Journée complète", "jour")]}
            for option_index, (label, amount, unit, currency_raw) in enumerate(labels):
                currency = currency_raw.upper().replace("$", "CAD")
                if len(currency) != 3: currency = "CAD"
                option = PricingOption(plan_id=plan.id, label=label, amount=Decimal(amount), currency=currency, unit=unit, note="", sort_order=option_index)
                set_translation_bundle(option, {locale: {"label": translated_labels[locale][option_index][0], "unit": translated_labels[locale][option_index][1], "note": ""} for locale in ("zh", "en", "fr")}); db.add(option)

        rental_notes = base_rental.get("notes", {}) if isinstance(base_rental, dict) else {}
        if rental_notes.get("title") or rental_notes.get("items"):
            block = PricingContentBlock(catalog_id=rental_catalog.id, block_type="notice", title=str(rental_notes.get("title") or ""), body="", items_json=json.dumps(rental_notes.get("items") or [], ensure_ascii=False), is_active=True, sort_order=0)
            translations = {}
            for locale, source in rental_sources.items():
                notes = source.get("notes", {}) if isinstance(source, dict) else {}
                translations[locale] = {"title": str(notes.get("title") or block.title), "body": "", "items": notes.get("items") or rental_notes.get("items") or []}
            set_translation_bundle(block, translations); db.add(block)

        db.commit()
        # Publish the currently visible program defaults. Rental remains a draft until real rooms are reviewed.
        from app.api.v1.pricing import _draft_response
        program_catalog.published_at = datetime.utcnow()
        locales = {locale: _draft_response(db, program_catalog, locale, translations=False) for locale in ("zh", "en", "fr")}
        program_catalog.published_json = json.dumps({"version": 1, "locales": locales}, ensure_ascii=False, default=str)
        program_catalog.is_dirty = False
        db.commit()
    except Exception as exc:
        logger.error(f"Pricing migration failed: {exc}", exc_info=True)
        db.rollback()
    finally:
        db.close()


def _seed_unified_schedule_resources_if_needed():
    """Create the initial Studio A/B resources without importing legacy bookings."""
    from app.models import Studio, StudioRoom
    from sqlalchemy import text

    session = None
    try:
        from app.core.database import SessionLocal
        session = SessionLocal()
        columns = {row[1] for row in session.execute(text("PRAGMA table_info(fixed_class_plans)")).fetchall()}
        if columns and "translations_json" not in columns:
            session.execute(text("ALTER TABLE fixed_class_plans ADD COLUMN translations_json TEXT"))
        if columns and "days_of_week_json" not in columns:
            session.execute(text("ALTER TABLE fixed_class_plans ADD COLUMN days_of_week_json TEXT DEFAULT '[]'"))
        studio = session.query(Studio).filter(Studio.name == "Mulan Dance Studio").first()
        if not studio:
            studio = Studio(name="Mulan Dance Studio", is_active=True)
            session.add(studio)
            session.flush()
        existing = {room.name for room in session.query(StudioRoom).filter(StudioRoom.studio_id == studio.id).all()}
        for name, order in (("Studio A", 10), ("Studio B", 20)):
            if name not in existing:
                session.add(StudioRoom(studio_id=studio.id, name=name, sort_order=order, is_active=True))
        session.commit()
    except Exception as e:
        logger.error(f"Unified schedule resource seed failed: {e}", exc_info=True)
        if session:
            session.rollback()
    finally:
        if session:
            session.close()


def _migrate_schedule_booking_visibility_if_needed():
    """Add the public schedule flag without changing visibility of existing bookings."""
    from sqlalchemy import text

    conn = engine.connect()
    try:
        columns = {row[1] for row in conn.execute(text("PRAGMA table_info(schedule_bookings)")).fetchall()}
        if columns and "is_public" not in columns:
            conn.execute(text("ALTER TABLE schedule_bookings ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT 0"))
            conn.commit()
    except Exception as e:
        logger.error(f"Schedule booking visibility migration failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_external_rental_schema_if_needed():
    """Add rental flags and the link from confirmed bookings to rental requests."""
    from sqlalchemy import text

    conn = engine.connect()
    try:
        room_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(studio_rooms)")).fetchall()}
        if room_columns and "is_rentable" not in room_columns:
            conn.execute(text("ALTER TABLE studio_rooms ADD COLUMN is_rentable BOOLEAN NOT NULL DEFAULT 0"))
        booking_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(schedule_bookings)")).fetchall()}
        if booking_columns and "external_request_id" not in booking_columns:
            conn.execute(text("ALTER TABLE schedule_bookings ADD COLUMN external_request_id VARCHAR(36)"))
        conn.commit()
    except Exception as e:
        logger.error(f"External rental schema migration failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_fixed_course_ai_drafts_if_needed():
    """Keep SQLite deployments compatible with fixed-course AI drafts."""
    from sqlalchemy import text

    conn = engine.connect()
    try:
        tables = {row[0] for row in conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))}
        if "course_templates" in tables:
            columns = {row[1] for row in conn.execute(text("PRAGMA table_info(course_templates)"))}
            additions = {
                "is_ai_draft": "ALTER TABLE course_templates ADD COLUMN is_ai_draft INTEGER NOT NULL DEFAULT 0",
                "ai_draft_meta_json": "ALTER TABLE course_templates ADD COLUMN ai_draft_meta_json TEXT",
                "allow_unassigned_teacher": "ALTER TABLE course_templates ADD COLUMN allow_unassigned_teacher INTEGER NOT NULL DEFAULT 0",
                "allow_unassigned_room": "ALTER TABLE course_templates ADD COLUMN allow_unassigned_room INTEGER NOT NULL DEFAULT 0",
            }
            for column, statement in additions.items():
                if column not in columns:
                    conn.execute(text(statement))
        if "course_offering_slots" in tables:
            slot_columns = {
                row[1]: row for row in conn.execute(text("PRAGMA table_info(course_offering_slots)"))
            }
            room_column = slot_columns.get("room_id")
            if room_column and int(room_column[3]) == 1:
                conn.commit()
                conn.execute(text("PRAGMA foreign_keys=OFF"))
                conn.execute(text("DROP TABLE IF EXISTS course_offering_slots_nullable_room"))
                conn.execute(text("""
                    CREATE TABLE course_offering_slots_nullable_room (
                        id VARCHAR(36) NOT NULL PRIMARY KEY,
                        offering_id VARCHAR(36) NOT NULL,
                        teacher_id VARCHAR(36),
                        room_id VARCHAR(36),
                        days_of_week_json TEXT,
                        start_time VARCHAR(5) NOT NULL,
                        end_time VARCHAR(5) NOT NULL,
                        sort_order INTEGER NOT NULL,
                        created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
                        FOREIGN KEY(offering_id) REFERENCES course_offerings (id) ON DELETE CASCADE,
                        FOREIGN KEY(teacher_id) REFERENCES users (id) ON DELETE SET NULL,
                        FOREIGN KEY(room_id) REFERENCES studio_rooms (id) ON DELETE RESTRICT
                    )
                """))
                conn.execute(text("""
                    INSERT INTO course_offering_slots_nullable_room
                        (id, offering_id, teacher_id, room_id, days_of_week_json, start_time, end_time, sort_order, created_at)
                    SELECT id, offering_id, teacher_id, room_id, days_of_week_json, start_time, end_time, sort_order, created_at
                    FROM course_offering_slots
                """))
                conn.execute(text("DROP TABLE course_offering_slots"))
                conn.execute(text("ALTER TABLE course_offering_slots_nullable_room RENAME TO course_offering_slots"))
                conn.execute(text("CREATE INDEX ix_course_offering_slots_offering_id ON course_offering_slots (offering_id)"))
                conn.execute(text("CREATE INDEX ix_course_offering_slots_teacher_id ON course_offering_slots (teacher_id)"))
                conn.execute(text("CREATE INDEX ix_course_offering_slots_room_id ON course_offering_slots (room_id)"))
                conn.commit()
                conn.execute(text("PRAGMA foreign_keys=ON"))
        if "system_settings" in tables:
            columns = {row[1] for row in conn.execute(text("PRAGMA table_info(system_settings)"))}
            if "ai_feature_models_json" not in columns:
                conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_feature_models_json TEXT"))
            if "ai_thinking_enabled" not in columns:
                conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_thinking_enabled INTEGER DEFAULT 0"))
            if "ai_image_enabled" not in columns:
                conn.execute(text("ALTER TABLE system_settings ADD COLUMN ai_image_enabled INTEGER DEFAULT 0"))
        conn.commit()
    except Exception as exc:
        logger.error(f"Fixed-course AI draft migration failed: {exc}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_logto_auth_schema_if_needed():
    """Add Logto identity columns for existing SQLite-first deployments."""
    from sqlalchemy import inspect, text

    with engine.begin() as conn:
        inspector = inspect(conn)
        if "users" not in inspector.get_table_names():
            return
        columns = {column["name"] for column in inspector.get_columns("users")}
        if "logto_subject" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN logto_subject VARCHAR(255)"))
        if "account_type" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN account_type VARCHAR(30)"))
        if "provisioning_status" not in columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN provisioning_status VARCHAR(20) NOT NULL DEFAULT 'active'"))
        conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_logto_subject ON users (logto_subject)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_account_type ON users (account_type)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_provisioning_status ON users (provisioning_status)"))


def _bootstrap_admin_from_env():
    """Bind the initial super admin to a Logto subject exactly once."""
    email = (settings.LOGTO_BOOTSTRAP_SUPER_ADMIN_EMAIL or settings.ADMIN_EMAIL).strip().lower()
    subject = settings.LOGTO_BOOTSTRAP_SUPER_ADMIN_SUB.strip()
    if not email or not subject:
        logger.info("Logto super-admin bootstrap values not set; skipping bootstrap.")
        return

    from app.core.database import SessionLocal
    from app.models import User, UserProfile

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash="logto-managed",
                role="super_admin",
                is_active=True,
                logto_subject=subject,
                provisioning_status="active",
            )
            db.add(user)
            db.flush()
            logger.info("Created Logto-bound super admin.")
        else:
            user.role = "super_admin"
            user.is_active = True
            user.provisioning_status = "active"
            if not user.logto_subject:
                user.logto_subject = subject
            elif user.logto_subject != subject:
                raise RuntimeError("Configured Logto subject does not match the bound super admin")
            db.flush()
            logger.info("Verified Logto super-admin binding.")

        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            db.add(
                UserProfile(
                    user_id=user.id,
                    first_name=settings.ADMIN_FIRST_NAME,
                    last_name=settings.ADMIN_LAST_NAME,
                )
            )
        else:
            profile.first_name = settings.ADMIN_FIRST_NAME
            profile.last_name = settings.ADMIN_LAST_NAME

        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Admin bootstrap failed.")
        raise
    finally:
        db.close()


def _seed_news_taxonomy_if_needed():
    """Ensure the default news categories and tags exist."""
    from sqlalchemy import text
    import uuid

    categories = [
        ("announcements", "Announcements", "公告", "Official studio announcements", "#6366f1"),
        ("performances", "Performances", "演出", "Performances, showcases, and stage events", "#ec4899"),
        ("classes", "Classes", "课程", "Class updates and schedules", "#10b981"),
        ("studio", "Studio", "工作室", "Studio news and updates", "#f59e0b"),
        ("registration", "Registration", "报名", "Registration and enrollment updates", "#0ea5e9"),
        ("events", "Events", "活动", "Workshops, camps, and community events", "#f97316"),
        ("general", "General", "综合", "General news and updates", "#8b5cf6"),
    ]
    tags = [
        ("summer-camp", "Summer Camp", "暑期夏令营"),
        ("registration", "Registration", "报名"),
        ("competition", "Competition", "比赛"),
        ("performance", "Performance", "演出"),
        ("schedule", "Schedule", "课表"),
        ("announcement", "Announcement", "公告"),
        ("chinese-dance", "Chinese Dance", "中国舞"),
        ("classical-dance", "Classical Dance", "古典舞"),
        ("folk-dance", "Folk Dance", "民族民间舞"),
        ("ballet", "Ballet", "芭蕾舞"),
        ("jazz", "Jazz", "爵士舞"),
        ("hip-hop", "Hip-Hop", "街舞"),
        ("contemporary", "Contemporary", "现代舞"),
        ("children", "Children", "少儿"),
        ("adult", "Adult", "成人"),
        ("beginner", "Beginner", "零基础"),
        ("advanced", "Advanced", "高级班"),
        ("workshop", "Workshop", "工作坊"),
        ("exam", "Exam", "考级"),
        ("trial-class", "Trial Class", "体验课"),
        ("new-term", "New Term", "新学期"),
        ("holiday", "Holiday", "假期"),
        ("notice", "Notice", "通知"),
        ("other", "Other", "其他"),
    ]

    conn = engine.connect()
    try:
        has_categories = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='news_categories'"
        )).fetchone()
        has_tags = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='news_tags'"
        )).fetchone()
        if has_categories is None or has_tags is None:
            return

        for slug, name, name_zh, description, color in categories:
            conn.execute(text("""
                INSERT OR IGNORE INTO news_categories (
                    id, slug, name, name_zh, description, color, is_active, created_at
                )
                VALUES (
                    :id, :slug, :name, :name_zh, :description, :color, 1, CURRENT_TIMESTAMP
                )
            """), {
                "id": str(uuid.uuid4()),
                "slug": slug,
                "name": name,
                "name_zh": name_zh,
                "description": description,
                "color": color,
            })

        for slug, name, name_zh in tags:
            conn.execute(text("""
                INSERT OR IGNORE INTO news_tags (id, slug, name, name_zh, created_at)
                VALUES (:id, :slug, :name, :name_zh, CURRENT_TIMESTAMP)
            """), {
                "id": str(uuid.uuid4()),
                "slug": slug,
                "name": name,
                "name_zh": name_zh,
            })

        conn.commit()
    except Exception as e:
        logger.error(f"News taxonomy seed failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


DEFAULT_SCHOOL_POLICY_MARKDOWN = """# 学校规章制度及退费规则

为保障教学质量及学员权益，请您仔细阅读以下学校规章制度及退费规定：

## 一、课时转让及退费规则

1. **已付清学费的转让规定**  
   若因个人原因无法继续上课，可自行将课时转让给其他学员，但必须遵循原购买课时的有效期，不可延期、不可再次转让，也不再符合退费要求。转让须经学校确认后方可生效，学校不参与任何与学费转让相关的协商和决策。

2. **未付清学费的退费规定**  
   若尚未付清学费并申请退费，学校将从已缴学费中收取 20% 作为手续费，且必须在规定有效期内提出申请。若学员逾期未缴清学费，则学校将以应付总学费为基数收取 20% 手续费。

3. **已付清学费中途退出的退费规定**
   - 若课程学习已超过一半，学校将从剩余课时中收取 25% 的学费作为手续费。
   - 若课程学习未超过一半，将收取 20% 的手续费。
   - 若无法完成转让，该退费规则将适用。

4. **课时有效期**  
   所有课时包的有效期最多可延长至一年，超过一年未使用的课时，学校将不予退费或转让。

5. **转让课时的限制**  
   经转让的课时不再享有退费或再次转让的权利。

## 二、请假及缺课规定

6. **请假次数规定**
   - 每周上课一次的学员，若三次以内因故未能上课，学校不扣除课时。超过三次则视为缺课，将按实际课时扣除，不论任何原因。
   - 每周上课两次及以上的学员，每门课程缺课不得超过三次，超出部分同样按缺课处理。

7. **有效期与缺课责任**  
   学员需留意课时有效期，因超期造成的损失由学员自行承担，学校概不负责。

8. **雪季及回国情况的特殊处理**  
   因雪季滑雪课程或回国探亲导致的暂时性停课，学校予以理解，并在此期间不扣除课时。但此类情况不再享受每学期三次不扣课时的政策。（暑期回国除外）

9. **病假、事假请假规定**  
   学员如需请病假或事假，须至少提前 12 小时通知任课老师或校方负责人，未按时通知将视为无故缺课并扣除课时。

10. **无故缺课处理**  
    如因个人原因未向老师请假并无故缺席，将视为自动放弃课程并扣除课时，病假事假亦同。

11. **比赛班请假规定**  
    比赛班一旦进入训练阶段，所有课程不得请假，所有课时将按排课记录扣除。

12. **学校原因导致停课**  
    若因学校原因无法正常上课，相应课程的有效期将自动顺延。

## 三、课程使用规定

13. **课程仅限个人使用**  
    所购买课程仅限一位学员本人使用，每位学员需使用独立账户，不可由两个孩子共用同一账户。

14. **课程升级规定**  
    课程购买后可在一个月内申请升级，超过一个月后不再接受变更。

15. **小班课程请假规定**  
    一对一、一对二、一对三、一对四、一对五的小班课，不论任何原因（包括病假、事假），均需扣除课时；若中途退出亦不予退费。

## 四、试听与体验课政策

16. **新学员试听课政策**  
    新学员可享受一节免费试听课，但仅限于正式报名课程后使用。

17. **体验课费用**
    - 未缴纳学费前，每节体验课收费为税后 30 加币/小时。
    - 如为两小时课程，则体验课费用为税后 60 加币，以此类推。
    - 单独购买试听课需支付 15 加币/节，试听课只限于新学员用来体验，也只有一次机会。

## 五、特殊课程及暑期安排

18. **大班课程招生规定**  
    所有 6 人以上的舞蹈课程对所有已购课学员开放。若因招生未满 6 人，则不收取任何费用。

19. **暑期 Camp 课程安排**
    - 比赛班及表演班学员须参加至少一周的 Camp 训练课程。
    - 每周四和周五上课的四个班属学校演出班，需至少报名一周 Camp 训练。

20. **暑期团队排练请假规定**  
    明年比赛节目将在暑期开始排练。家长需合理安排孩子时间，避免因个人外出影响团队训练。暑期团队排练请假不得超过两次，超出部分将扣除课时。

请您在报名及缴费前务必详细阅读以上规定，学校将严格依照此规章制度执行。  
如有疑问请先咨询校方。学校在法律允许范围内保留条款解释与调整权。  
（最终解释权归 Mulan Dance Studio 所有）
"""


def _seed_course_schedule_if_needed():
    """Seed public course schedule and school policy defaults."""
    from sqlalchemy import text
    import uuid

    default_items = [
        (1, "舞蹈启蒙周一班", "17:00", "18:00", "4岁到5岁零基础，小班教学人数限制12人。", "2527 Baseline Road 二楼", 10),
        (1, "舞蹈中班", "18:30", "20:30", "9岁以上有一定基础。", "2527 Baseline Road 二楼", 20),
        (2, "舞蹈小班", "17:00", "19:00", "8岁以上有一定基础。", "2527 Baseline Road 二楼", 10),
        (3, "舞蹈启蒙周三班", "16:30", "17:30", "4岁-6岁零基础，小班教学人数限制12人。", "685 River Road 二楼", 10),
        (3, "周三幼小班", "17:30", "19:00", "6岁以上学过一年以上有基础的孩子。", "685 River Road 二楼", 20),
        (3, "周三小班(2)班", "19:00", "20:30", "7岁以上有一定基础的孩子。", "685 River Road 二楼", 30),
        (3, "街舞大班", "18:00", "20:00", "", "2527 Baseline Road 二楼", 40),
        (4, "芭蕾(1)班", "17:00", "18:30", "6岁以上有一定基础的孩子。", "2527 Baseline Road 二楼", 10),
        (4, "芭蕾(2)班", "18:30", "20:00", "7岁以上有一定基础的孩子。", "2527 Baseline Road 二楼", 20),
        (5, "舞蹈小班", "16:30", "18:30", "8岁以上有一定基础的孩子。", "2527 Baseline Road 二楼", 10),
        (5, "舞蹈中班", "18:30", "20:30", "9岁以上有一定基础的孩子。", "2527 Baseline Road 二楼", 20),
        (6, "舞蹈大班", "10:00", "12:00", "十三岁以上的孩子。", "2527 Baseline Road 二楼", 10),
        (6, "比赛1班", "12:00", "14:30", "经过选拔的孩子。", "2527 Baseline Road 二楼", 20),
        (6, "比赛2班", "14:30", "17:00", "经过选拔出来的孩子。", "2527 Baseline Road 二楼", 30),
        (6, "比赛3班", "15:00", "18:00", "经过选拔的孩子。", "2527 Baseline Road 二楼", 40),
        (0, "舞蹈周日1班", "10:00", "11:30", "6岁以上有半年以上舞蹈学习的经历。", "2527 Baseline Road 二楼", 10),
        (0, "舞蹈周日2班", "14:30", "16:30", "7岁以上有一年舞蹈学习经历的孩子。", "2527 Baseline Road 二楼", 20),
        (0, "幼儿街舞启蒙班", "17:00", "18:00", "", "2527 Baseline Road 二楼", 30),
    ]

    conn = engine.connect()
    try:
        has_schedule = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='course_schedule_items'"
        )).fetchone()
        has_policy = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='school_policies'"
        )).fetchone()
        if has_schedule is None or has_policy is None:
            return

        schedule_count = conn.execute(text("SELECT COUNT(*) FROM course_schedule_items")).scalar()
        if schedule_count == 0:
            for day, title, start, end, description, location, order_index in default_items:
                conn.execute(text("""
                    INSERT INTO course_schedule_items (
                        id, day_of_week, title, start_time, end_time, description,
                        location, is_active, order_index, created_at
                    )
                    VALUES (
                        :id, :day_of_week, :title, :start_time, :end_time, :description,
                        :location, 1, :order_index, CURRENT_TIMESTAMP
                    )
                """), {
                    "id": str(uuid.uuid4()),
                    "day_of_week": day,
                    "title": title,
                    "start_time": start,
                    "end_time": end,
                    "description": description,
                    "location": location,
                    "order_index": order_index,
                })

        policy_count = conn.execute(text("SELECT COUNT(*) FROM school_policies")).scalar()
        if policy_count == 0:
            conn.execute(text("""
                INSERT INTO school_policies (id, title, body_markdown, updated_at)
                VALUES (1, :title, :body_markdown, CURRENT_TIMESTAMP)
            """), {
                "title": "学校规章制度及退费规则",
                "body_markdown": DEFAULT_SCHOOL_POLICY_MARKDOWN,
            })

        policy_path = Path(settings.NEWS_FILES_DIR).parent / "pages" / "school-policy.md"
        if not policy_path.exists():
            existing_policy = conn.execute(text(
                "SELECT body_markdown FROM school_policies WHERE id = 1"
            )).fetchone()
            policy_body = (
                existing_policy[0]
                if existing_policy and existing_policy[0]
                else DEFAULT_SCHOOL_POLICY_MARKDOWN
            )
            policy_path.parent.mkdir(parents=True, exist_ok=True)
            policy_path.write_text(policy_body, encoding="utf-8", newline="")
            conn.execute(text(
                "UPDATE school_policies SET body_markdown = '', updated_at = CURRENT_TIMESTAMP WHERE id = 1"
            ))

        conn.commit()
    except Exception as e:
        logger.error(f"Course schedule seed failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


app = FastAPI(
    title="Mulan Dance Studio API",
    description="REST API for the Mulan Dance Studio website",
    version="2.3.0-alpha.3",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Startup event: ensure everything is initialized
@app.on_event("startup")
async def startup_event():
    """Initialize database and data directories on app startup."""
    logger.info("=" * 50)
    logger.info("Mulan Dance Studio API - Starting up")
    logger.info("=" * 50)
    
    _ensure_data_directories()
    _ensure_database_tables()
    _migrate_logto_auth_schema_if_needed()
    _migrate_admin_roles_if_needed()
    _migrate_multilingual_nicknames_if_needed()
    _bootstrap_admin_from_env()
    _migrate_system_settings_if_needed()
    _migrate_programs_if_needed()
    _migrate_faculty_account_link_if_needed()
    _migrate_pricing_catalogs_if_needed()
    _migrate_schedule_booking_visibility_if_needed()
    _migrate_external_rental_schema_if_needed()
    _migrate_fixed_course_ai_drafts_if_needed()
    _seed_news_taxonomy_if_needed()
    _seed_course_schedule_if_needed()
    _migrate_article_groups_if_needed()
    _ensure_article_group_source_url_column()
    
    logger.info("Startup complete.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS.split(","),
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Mount static files for uploaded images
UPLOADS_DIR = Path(settings.UPLOADS_DIR)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dance-org-api"}
