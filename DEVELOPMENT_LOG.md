# 木兰舞蹈工作室 - 开发日志

## Alpha 1.0 版本 (2026-05-24)

### 今日开发内容

#### 1. 项目初始化与架构搭建
- 创建前后端项目结构
- 前端：Next.js 14.2.15 (App Router) + TypeScript + Tailwind CSS
- 后端：FastAPI (Python) + PostgreSQL
- 国际化：next-intl 支持中英文 (en/zh)
- Docker 部署配置

#### 2. 国际化配置修复
- 创建 `frontend/next.config.js` 配置 next-intl webpack 插件
- 创建 `frontend/src/i18n.ts` 请求处理器
- 修复 `frontend/middleware.ts` 中间件配置
- 解决 `clientModules` 错误问题

#### 3. 路由系统完善
- 创建根路径重定向 `frontend/src/app/page.tsx` (/ → /en)
- 所有导航链接添加 locale 前缀 (/en, /zh)
- 修复 Header 组件链接问题

#### 4. 页面开发
- 首页 (Home) - 轮播、课程展示、统计数据、学员评价
- 关于我们 (About) - 教学理念、培养目标、机构愿景
- 师资力量 (Faculty) - 三位老师完整简历
- 联系我们 (Contact) - 联系表单
- 课程页面 (Programs) - 6大课程分类
- 演出页面 (Performances) - 演出季信息
- 优雅 404 页面 - 支持中英文

#### 5. 老师信息更新
- 鲍俊伟老师 - 创始人兼主讲教师
- Kayley (宝熊老师) - 编舞/Jazz/K-Pop/Hip-Hop
  - 11项成就（比赛奖项、演出经历、艺人合作）
- Hailey Smith - Ballet/Jazz/Acro
  - 5项成就（YAGP排名、学术背景）

#### 6. UI/UX 优化
- 移除关于我们页面的卡片导航（教学理念、师资力量、联系我们）
- 优化页面内容布局
- 统一设计风格（紫色主题 + 金色强调）

### 技术栈
- **前端**: Next.js 14.2.15, TypeScript, Tailwind CSS, next-intl
- **后端**: FastAPI, Python 3.11+, PostgreSQL
- **部署**: Docker, Docker Compose, Nginx

### 下一步计划
1. 完善后端 API 接口
2. 添加图片资源
3. 实现学员门户功能
4. 添加在线报名系统
5. 性能优化与 SEO 优化

---

## Alpha 1.1.0 版本 (2026-05-25) — 新闻博客 CMS 系统

### 今日开发内容

#### 1. 后端 - 文件存储层 (Phase 1)

##### 新增依赖
- `python-frontmatter==1.1.0` — YAML frontmatter 解析
- `mistune==3.0.2` — Markdown 到 HTML 渲染（服务端）
- `beautifulsoup4==4.12.3` — HTML 清理/去重

##### Config 扩展 (`backend/app/core/config.py`)
- `NEWS_FILES_DIR: str = "./data/news"` — 博客文件存储目录
- `USE_FILE_STORAGE: bool = True` — 功能开关

##### 模型扩展 (`backend/app/models/__init__.py`)
- 新增 `NewsCategory` — 新闻分类（slug/name/name_zh/description/color）
- 新增 `NewsTag` — 新闻标签（slug/name/name_zh）
- 新增 `NewsArticleCategory` — 文章-分类关联表
- 新增 `NewsArticleTag` — 文章-标签关联表
- `NewsArticle` 添加 `locale` 字段（默认 "en"）
- 新增 `EDITOR` 角色到 `UserRole` 枚举

##### API 路由 (`backend/app/api/v1/news.py` — 新建，12 个端点)
- `GET /api/v1/news` — 公开：获取已发布文章列表（支持 `?category=&tag=&search=&limit=`）
- `GET /api/v1/news/{slug}` — 公开：获取单篇文章（含 HTML）
- `POST /api/v1/news` — 认证(admin/editor)：创建文章
- `PUT /api/v1/news/{slug}` — 认证(editor)：更新文章
- `DELETE /api/v1/news/{slug}` — 认证(admin)：删除文章
- `GET /api/v1/news/categories` — 公开：获取所有分类
- `GET /api/v1/news/tags` — 公开：获取所有标签
- `POST/PUT/DELETE /news/categories/{slug}` — 认证(admin)：分类 CRUD
- `POST/DELETE /news/tags/{slug}` — 认证(admin)：标签 CRUD

##### 文件存储服务 (`backend/app/services/news_files.py` — 新建，13.6KB)
- `list_articles()` — 扫描文件 + 数据库联合查询，支持分类/标签/搜索过滤
- `get_article()` — 读取 `.md` 文件 + frontmatter + DB 元数据
- `create_article()` — 写入 `.md` 文件 + 创建 DB 记录 + 关联分类/标签
- `update_article()` — 更新文件内容 + DB 元数据 + 分类标签关系
- `delete_article()` — 删除 `.md` 文件 + DB 记录 + 关联关系
- `render_markdown()` — 使用 mistune 渲染 Markdown → HTML
- `list/create/update/delete categories` — 分类 CRUD
- `list/create/delete tags` — 标签 CRUD
- `sync_all_from_db()` — 从 DB body 字段批量恢复 `.md` 文件

##### Seed 脚本 (`backend/init_db.py`) — 扩展
- `--create-admin` — 创建首个管理员用户
- `--seed-categories` — 预置 5 个分类（公告/演出/课程/工作室/综合）
- `--seed-tags` — 预置 3 个标签（暑期夏令营/报名/比赛）

#### 2. 后端 - 数据库迁移 (Phase 2)

##### Alembic 迁移 (`backend/alembic/versions/add_news_categories_tags.py`)
- 创建 `news_categories`、`news_tags`、`news_article_categories`、`news_article_tags` 表
- 为 `news_articles` 添加 `locale` 列
- 预置 5 个分类的 seed 数据

##### 完整 Schema (`backend/alembic/initial.sql`) — 末尾追加
- 4 张新表 + 7 个索引
- `ALTER TABLE users` 添加 `editor` 到角色检查约束

##### Docker Compose (`docker-compose.yml`)
- `fastapi` 服务添加 `./backend/data:/app/data` 持久卷挂载
- 添加 `NEWS_FILES_DIR` 和 `USE_FILE_STORAGE` 环境变量

##### 初始 SQL — 角色扩展
- `users_role_check` 添加 `editor` 角色

#### 3. 前端 - API 层 (Phase 3 - 前部分)

##### API Client 升级 (`frontend/src/lib/api.ts`)
- 新增 `getAuthToken()` / `setAuthToken()` / `clearAuthToken()` / `isAuthenticated()` — Token 管理
- 新增 `newsApi` 对象 — 统一封装所有博客 API 调用（list/get/create/update/remove/categories/tags）
- `request()` 自动携带 `Authorization: Bearer` 头

##### 表单验证 (`frontend/src/lib/validation.ts`)
- 新增 `newsArticleSchema` — 文章创建/更新 Zod 验证
- 新增 `categorySchema` / `tagSchema` — 分类/标签验证
- 新增 TypeScript 类型导出

#### 4. 前端 - 管理后台 (Alpha 1.1.0 核心功能)

##### 页面结构 (8 个新页面)
- `[locale]/admin/layout.tsx` — 认证守卫布局（未登录自动跳转 `/admin/login`）
- `[locale]/admin/login/page.tsx` — 管理员登录页
- `[locale]/admin/dashboard/page.tsx` — 仪表板（统计卡片 + 快捷操作）
- `[locale]/admin/editor/page.tsx` — 博客编辑器（Typecho 风格）
- `[locale]/admin/editor/[slug]/page.tsx` — 编辑已有文章
- `[locale]/admin/articles/page.tsx` — 文章管理（搜索/筛选/删除）
- `[locale]/admin/categories/page.tsx` — 分类管理（CRUD + 对话框）
- `[locale]/admin/tags/page.tsx` — 标签管理（CRUD + 对话框）

##### 编辑器特性 (`editor/page.tsx` — 15.1KB)
- 标题输入 → 自动生成 slug（支持中文）
- 摘要、封面图片 URL 字段
- 分类多选 → 彩色 Badge 展示
- 标签输入 → 逗号分隔 / 自动创建
- 语言选择器（en/zh）
- 发布/草稿 切换
- Markdown 工具栏：**B** *I* H1-H3 ─ [link] ![image] `code` >quote
- 字数/字符统计
- 左侧编辑 + 右侧预览 分栏模式
- 自动保存草稿到 localStorage（每 30 秒）
- 最后保存时间显示

#### 5. 前端 - 公开新闻页面

##### 页面结构
- `[locale]/news/page.tsx` — 新闻列表页（分类筛选 + 卡片网格）
- `[locale]/news/[slug]/page.tsx` — 文章详情页（封面/标题/标签/HTML 渲染体）

##### NewsGrid 升级 (`frontend/src/components/sections/NewsGrid.tsx`)
- 从硬编码数据切换为 API 驱动（`newsApi.list({limit: 6})`）
- 添加加载骨架屏 (Skeleton)
- 封面图片支持（空时显示渐变占位）
- 动态 locale 路由前缀

#### 6. 国际化 (i18n)

##### `en.json` + `zh.json` (各新增 116 行)
- `admin.*` — 完整管理后台翻译（登录/仪表板/编辑器/文章/分类/标签/通用按钮）
- `news.*` — 公共新闻页翻译（标题/筛选/阅读更多/返回新闻）
- 中文翻译与英文完全对应

#### 7. 基础设施 - Nginx 安全防护 (`nginx/conf.d/default.conf`)
- `limit_req_zone $binary_remote_addr zone=api_write:10m rate=10r/m` — 写操作限流区域
- `/api/` 路径启用 `rate_limit_by_zone` 和 `limit_req zone=api_write burst=5 nodelay`
- 限制 POST/PUT/DELETE 为每分钟 10 次（突发 5 次）

#### 8. 前端依赖升级 (`frontend/package.json`)
- 新增 `marked@^14.1.3`（客户端 Markdown 渲染）

### 修复与优化

- **路由路径修复**: 前端 `api.ts` 的 `/news` 端点改为 `/v1/news` 以匹配后端 `prefix="/api/v1"`（之前 404）
- **SQLAlchemy order_by 修复**: 使用 `case((column.isnot(None), column), else_=other).desc()` 替代 `!= None` Python 比较
- **Mistune v3.0.2 API 兼容**: 使用 `mistune.create_markdown(renderer=mistune.HTMLRenderer())` 替代不兼容的 `formatter` 参数
- **bcrypt 版本降级**: 从 5.0.0 降级到 4.2.1 以兼容 passlib 的 `CryptContext`

### 文件统计

| 变更类型 | 文件数 | 新增/修改 行数 |
|---------|--------|--------------|
| 后端新文件 | 5 | ~20.3 KB |
| 后端修改文件 | 6 | ~224 行 |
| 前端新文件 | 10 | ~66.7 KB |
| 前端修改文件 | 9 | ~580 行 |
| Nginx 配置修改 | 1 | +7 行 |

### 下次计划
1. 前端 Markdown 预览渲染集成（marked）
2. 图片上传功能（后端 `/uploads/` 存储）
3. 前端构建验证（`npm run build`）
4. Docker Compose 端到端测试
5. 单元测试（后端 pytest）
