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
    base_dir = Path(settings.NEWS_FILES_DIR).parent
    dirs = {
        "news": base_dir / "news",
        "uploads": base_dir / "uploads",
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
    import uuid

    defaults = [
        ("chinese", "Chinese Dance", "Classical and folk Chinese dance training for different ages and levels.", "dance", "All levels", "/programs/chinese-dance.jpg", 10),
        ("folk", "Folk Dance", "Folk dance classes that build rhythm, culture, and stage confidence.", "dance", "All levels", "/programs/folk-dance.jpg", 20),
        ("ballet", "Ballet", "Structured ballet training focused on technique, posture, musicality, and strength.", "dance", "Children, teens, adults", "/programs/ballet.jpg", 30),
        ("contemporary", "Contemporary", "Contemporary dance training with technique, improvisation, and creative movement.", "dance", "Beginner to advanced", "/programs/contemporary.jpg", 40),
        ("jazz", "Jazz", "Jazz dance classes with energy, flexibility, musicality, and performance skills.", "dance", "Beginner to advanced", "/programs/jazz.jpg", 50),
        ("hip-hop", "Hip-Hop", "Street dance training covering foundations, groove, choreography, and freestyle.", "dance", "Beginner to advanced", "/programs/hip-hop.jpg", 60),
        ("summer-camps", "Summer Camps", "Seasonal camp programs with dance training, activities, and performance opportunities.", "camp", "Ages 5+", "/programs/summer-camps.jpg", 70),
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

        conn.commit()
    except Exception as e:
        logger.error(f"Program migration failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


def _migrate_system_settings_if_needed():
    """Add newer settings columns to existing SQLite databases."""
    from sqlalchemy import text

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
        conn.commit()
    except Exception as e:
        logger.error(f"System settings migration failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()


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
    title="Grace Dance Academy API",
    description="REST API for the Grace Dance Academy website",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Startup event: ensure everything is initialized
@app.on_event("startup")
async def startup_event():
    """Initialize database and data directories on app startup."""
    logger.info("=" * 50)
    logger.info("Grace Dance Academy API - Starting up")
    logger.info("=" * 50)
    
    _ensure_data_directories()
    _ensure_database_tables()
    _migrate_system_settings_if_needed()
    _migrate_programs_if_needed()
    _seed_news_taxonomy_if_needed()
    _seed_course_schedule_if_needed()
    _migrate_article_groups_if_needed()
    
    logger.info("Startup complete.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Mount static files for uploaded images
UPLOADS_DIR = Path(settings.NEWS_FILES_DIR).parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "dance-org-api"}
