# Mulan Dance Studio Website

Mulan Dance Studio 官网和后台管理系统。项目包含前台展示页、后台内容管理、报名入口、新闻文章、多语言 UI、课程排课表、教室租借、教师/课程/系统设置等模块。

当前版本：`alpha v2.0.1`

## 技术栈

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: SQLite development database at `backend/dance_org.db`
- Content files: Markdown and uploaded files under `data/`
- UI icons: `lucide-react`
- i18n: `zh`, `zh-Hant`, `en`, `fr`
  - `zh-Hant` 由简体中文自动转换，不建议单独保存繁体内容。

## 快速启动

### Windows 一键安装

```bat
install_win.bat
```

作用：

- 拉取 `main` 最新代码
- 创建或复用 `venv`
- 安装后端依赖
- 安装前端依赖
- 同步开发数据库

默认管理员：

```text
admin@mulandance.com / admin123
```

### Windows 一键启动

```bat
start-all.bat
```

启动后访问：

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 手动启动

Backend:

```bat
cd backend
..\venv\Scripts\activate.bat
set PYTHONPATH=%cd%
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Frontend:

```bat
cd frontend
npm run dev
```

## 项目结构

```text
backend/                  FastAPI 后端
backend/app/api/v1/       API 路由
backend/app/models/       SQLAlchemy 数据模型
backend/app/schemas/      Pydantic 请求/响应结构
backend/app/services/     业务服务，例如文章文件保存
frontend/                 Next.js 前端
frontend/src/app/         App Router 页面
frontend/src/components/  UI 和布局组件
frontend/src/lib/api.ts   前端 API client
frontend/src/lib/locales/ 多语言 JSON
data/news/                文章 Markdown 文件
data/pages/               页面 Markdown 文件，例如规章制度
data/uploads/             上传图片和文件
docs/                     设计、交付、部署等开发文档
```

## 功能模块

### 1. 前台首页

路径：

```text
/{locale}
```

用途：

- 展示学校品牌、课程入口、演出活动入口和报名 CTA。
- Header 使用系统设置里的 logo、站点名、报名按钮链接。
- 支持简体中文、繁体中文、英文、法语 UI。

主要文件：

```text
frontend/src/app/[locale]/page.tsx
frontend/src/components/layout/Header.tsx
frontend/src/components/layout/Footer.tsx
frontend/src/lib/locales/*.json
```

### 2. 新闻文章

前台：

```text
/{locale}/news
/{locale}/news/[slug]
```

后台：

```text
/{locale}/admin/articles
/{locale}/admin/editor
/{locale}/admin/editor/[slug]
```

用途：

- 管理新闻、公告、文章。
- 一个文章组可以有多个语言版本，例如 `zh`, `en`, `fr`。
- 后台会提示缺失语言版本。
- 文章内容保存为 Markdown 文件，不只依赖数据库。

数据位置：

```text
data/news/{year}/{slug}.md
```

说明：

- 数据库保存文章索引、slug、发布时间、分类、标签等元数据。
- Markdown 文件保存正文内容。
- 图片和附件通过上传接口存入 `data/uploads/`。

### 3. 分类和标签

后台：

```text
/{locale}/admin/categories
/{locale}/admin/tags
```

用途：

- 给文章做分类和标签。
- 默认分类包括公告、演出、课程、工作室、综合等。
- 标签可用于夏令营、报名、比赛、不同舞种等筛选。

开发注意：

- 编辑器页面会从后端同步分类和标签，不应该在前端长期写死。

### 4. 演出与活动时间线

前台：

```text
/{locale}/performances
/{locale}/performances/[slug]
```

旧路径跳转：

```text
/{locale}/events/calendar      -> /{locale}/performances
/{locale}/events/workshops     -> /{locale}/performances
/{locale}/performances/archive -> /{locale}/performances#archive
```

用途：

- 统一展示演出、活动、比赛、Camp 和往期档案。
- 页面是时间线形式，分为即将开始、往期档案、相关文章。
- 新闻文章如果分类为演出，会出现在“演出相关文章”里，但不会混入演出主数据。

后台：

```text
/{locale}/admin/performances
/{locale}/admin/performances/list
/{locale}/admin/performances/editor
/{locale}/admin/performances/editor/[id]
```

开发注意：

- 目前演出/活动类型主要通过标题和描述推断。
- 后续建议给 `Performance` 增加明确字段：`event_type`, `registration_url`, `related_article_ids`。

### 5. 课程与 Program

前台：

```text
/{locale}/programs
/{locale}/programs/chinese-dance
/{locale}/programs/ballet
/{locale}/programs/contemporary
/{locale}/programs/jazz
/{locale}/programs/hip-hop
/{locale}/programs/summer-camps
```

后台：

```text
/{locale}/admin/programs
```

用途：

- 前台展示课程体系和课程详情。
- 后台可维护课程名称、简介、图片等内容。

开发注意：

- 课程后台目前还没有完整的多语言编辑结构。
- 后续应拆成主表 + 翻译表，或者保存 `translations` JSON。

### 6. 排课表

前台：

```text
/{locale}/classes/schedule
```

后台：

```text
/{locale}/admin/schedules
```

用途：

- 前台以周历形式展示课程排课。
- 后台可新增、编辑、删除课程时段。
- 同一页面还管理学校规章制度和退费规则 Markdown。

数据：

- 排课项目存在数据库表 `course_schedule_items`。
- 学校规章制度正文保存为 Markdown 文件：

```text
data/pages/school-policy.md
```

开发注意：

- 排课标题和说明目前还没有多语言编辑。
- 后续建议增加 `course_schedule_translations` 或 JSON translations。

### 7. 学校规章制度及退费规则

前台展示在：

```text
/{locale}/classes/schedule
```

后台编辑在：

```text
/{locale}/admin/schedules
```

用途：

- 管理学校规章制度、请假规则、退费规则。
- 内容使用 Markdown，方便非开发人员维护。

文件：

```text
data/pages/school-policy.md
```

### 8. 报名链接

前台：

```text
/{locale}/classes/register
```

后台：

```text
/{locale}/admin/registrations
```

用途：

- 管理通用报名链接。
- 管理夏令营报名链接，夏令营可以先暂待。
- 前台报名按钮读取后台配置，跳转到管理员填写的链接。

### 9. 教师页面

前台：

```text
/{locale}/about/leadership
```

后台：

```text
/{locale}/admin/faculty
```

用途：

- 管理教师姓名、照片、简介、排序和显示状态。
- 让内容人员可以维护教师信息，不需要开发人员改代码。

开发注意：

- 教师内容目前还没有完整多语言编辑。
- 图片上传应继续走 `data/uploads/images/`。

### 10. 租教室

前台：

```text
/{locale}/classrooms
```

后台：

```text
/{locale}/admin/classrooms
```

用途：

- 前台以周历显示大教室、小教室已确认使用时段。
- 外部用户可以提交租借申请。
- 后台可以管理内部老师分配和外部租借申请。
- 管理员确认后，该时段显示到前台公开日历。

数据：

- 数据库存储教室预约记录。
- 字段包括教室类型、星期、开始/结束时间、申请人、联系方式、状态等。

### 11. 系统设置

后台：

```text
/{locale}/admin/settings
```

用途：

- 管理网站名称、logo、页眉按钮、公告条、页脚描述、copyright、联系信息、社交媒体链接等。
- Header 和 Footer 会读取这些设置。

开发注意：

- 系统设置目前是站点级配置，不是完整多语言配置。
- 后续若要不同语言显示不同 footer 文案，需要增加 settings translations。

### 12. 多语言

支持语言：

```text
zh       简体中文
zh-Hant  繁体中文，自动从简体转换
en       英文
fr       法语
```

语言文件：

```text
frontend/src/lib/locales/zh.json
frontend/src/lib/locales/en.json
frontend/src/lib/locales/fr.json
```

当前策略：

- UI 文案从 JSON 文件读取。
- 文章支持独立语言版本。
- 繁体不作为单独内容保存，避免从繁体切不回简体。

后续重点：

- Program、Faculty、Performance、Schedule、Settings 需要补后台多语言编辑。
- 推荐数据结构：

```text
主表:
  id, slug, image, sort_order, is_active, created_at, updated_at

翻译表:
  parent_id, locale, title/name, summary, description, body_markdown
```

## API 概览

常用 API 前缀：

```text
http://localhost:8000/api/v1
```

重要路由：

```text
/api/v1/news
/api/v1/events/performances
/api/v1/programs
/api/v1/faculty
/api/v1/schedules/classes
/api/v1/schedules/policy
/api/v1/classrooms/bookings
/api/v1/settings
/api/v1/upload/image
/api/v1/upload/file
```

API 文档：

```text
http://localhost:8000/docs
```

## 文件和内容存储规则

原则：

- 大段内容优先保存为 Markdown 文件。
- 数据库保存索引、状态、slug、日期、分类等结构化元数据。
- 图片和附件保存到 `data/uploads/`。

当前文件目录：

```text
data/news/2026/             文章 Markdown
data/pages/school-policy.md 学校规章制度 Markdown
data/uploads/images/        上传图片
data/uploads/files/         上传附件
```

## 开发命令

Frontend:

```bat
npm --prefix frontend run dev
npm --prefix frontend run typecheck
npm --prefix frontend run build
```

Backend:

```bat
cd backend
..\venv\Scripts\activate.bat
set PYTHONPATH=%cd%
python -m uvicorn app.main:app --reload --port 8000
```

数据库检查：

```bat
cd backend
..\venv\Scripts\python.exe -c "from app.core.database import engine; from sqlalchemy import text; c=engine.connect(); print(c.execute(text('SELECT name FROM sqlite_master WHERE type=''table'' ORDER BY name')).fetchall()); c.close()"
```

## 已知开发注意点

- `frontend/.next`, `frontend/node_modules`, `backend/dance_org.db`, `__pycache__` 不应提交。
- 运行 `next build` 后可能修改 `frontend/tsconfig.tsbuildinfo`，通常不要提交。
- 如果构建出现旧页面模块找不到，可以删除 `frontend/.next` 后重试。
- 当前还有一些旧页面使用 `<img>`，构建会提示 Next Image warning，不影响运行。
- 后台内容多语言还未全面完成，接手开发时建议先统一数据模型再改 UI。

## 推荐下一步开发

1. 给 Program 增加多语言编辑。
2. 给 Faculty 增加多语言编辑。
3. 给 Performance 增加 `event_type`, `registration_url`, `related_articles`。
4. 给 Schedule 增加课程名称和说明的多语言版本。
5. 给 System Settings 增加多语言 footer、copyright、公告。
6. 做一个后台“缺失语言版本检查器”。
7. 把旧静态页面内容逐步迁移到后台可编辑数据。

## License

Copyright 2026 Mulan Dance Studio. All rights reserved.
