# 部署与环境配置

本文档说明当前 Docker 部署方式、环境变量、持久化数据目录和安全升级流程。

## 服务组成

当前运行时只有两个服务：

- `backend`：FastAPI API、数据库访问、上传文件、Markdown 文章存储。
- `frontend`：Next.js 前台网站和后台界面。

当前推荐部署方式是 SQLite 加外部持久化数据目录。不要直接恢复旧的 Postgres Compose 配置；当前启动迁移和文件内容路径都围绕 `/app/data` 设计。

## 必须持久化的数据

后端容器需要把宿主机数据目录挂载到：

```yaml
${HOST_DATA_DIR:-./data}:/app/data
```

后端会在里面保存：

- `/app/data/app.db`：SQLite 数据库。
- `/app/data/news`：新闻文章 Markdown。
- `/app/data/pages`：可编辑页面 Markdown，例如学校规章制度及退费规则。
- `/app/data/uploads`：文章图片、教室图片、文件、导入图片、首页视频。
- `/app/data/backups`：后续备份输出目录。

生产环境建议把 `HOST_DATA_DIR` 放到源码目录外面：

```env
HOST_DATA_DIR=/srv/mulandance-data
```

本地简单部署也可以用：

```env
HOST_DATA_DIR=../mulandance-data
```

原因：如果 `HOST_DATA_DIR=./data`，删除或重新 clone 项目目录时，数据库和上传文件也会一起被删。把数据目录放到源码目录外，`git pull`、重建镜像、重新 clone 都不会动业务数据。

## 关键环境变量

复制 `.env.example` 为 `.env` 后修改。

核心配置：

```env
SECRET_KEY=change_me_to_a_long_random_secret
DATABASE_URL=sqlite:////app/data/app.db
ALLOWED_HOSTS=https://your-domain.com
```

公开 URL：

```env
PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

内容目录：

```env
HOST_DATA_DIR=/srv/mulandance-data
DATA_DIR=/app/data
NEWS_FILES_DIR=/app/data/news
UPLOADS_DIR=/app/data/uploads
```

`PUBLIC_BASE_URL` 控制上传后返回的公开文件 URL，例如：

```text
https://your-domain.com/static/uploads/images/editor/YYYY/MM/file.png
```

## Docker 命令

本地启动：

```bash
cp .env.example .env
docker compose up --build
```

本地访问：

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
Uploads:  http://localhost:8000/static/uploads/...
```

生产环境使用真实域名时，至少设置：

```env
PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
ALLOWED_HOSTS=https://your-domain.com
```

修改 `NEXT_PUBLIC_*` 后必须重建前端，因为这些值会被打进 Next.js 客户端包：

```bash
docker compose build --no-cache frontend
docker compose up -d
```

## 安全升级流程

以后新版本建议这样升级：

```bash
docker compose down
cp -a "$HOST_DATA_DIR" "$HOST_DATA_DIR.backup.$(date +%Y%m%d-%H%M%S)"
git pull
docker compose build --pull
docker compose up -d
```

启动后检查：

- 后台登录是否正常。
- 旧新闻文章是否还在。
- 旧上传图片是否能从 `/static/uploads/...` 打开。
- 系统设置和 AI 设置是否还在。

如果需要删除并重新 clone 代码目录，确保 `.env` 和 `HOST_DATA_DIR` 都在源码目录外，或者重新 clone 后把 `.env` 放回新目录。

正常升级不要使用：

```bash
docker compose down -v
```

`-v` 会删除 Docker 管理的 volume。虽然当前主要使用 host bind mount，但以后如果加了 volume，`down -v` 可能误删数据。

## 备份脚本

Windows PowerShell：

```powershell
.\scripts\backup-data.ps1 -DataDir ..\mulandance-data
```

Linux/macOS：

```bash
./scripts/backup-data.sh ../mulandance-data
```

## 反向代理

如果使用 Nginx 或平台代理，建议：

- `/` 转发到前端 `3000`
- `/api/` 转发到后端 `8000`
- `/static/uploads/` 转发到后端 `8000`，或者直接由代理服务器读取挂载的 uploads 目录

后端已经把上传文件挂载到：

```text
/static/uploads
```

## AI 配置

AI 可以在后台配置：

```text
Admin -> System Settings -> AI API Connection
```

`.env` 中的 AI 变量只是默认值。后台系统设置里的值优先生效。

## 生产检查清单

- 修改 `SECRET_KEY`。
- 把 `HOST_DATA_DIR` 设置到源码目录外，例如 `/srv/mulandance-data`。
- 设置 `PUBLIC_BASE_URL`、`NEXT_PUBLIC_API_URL`、`NEXT_PUBLIC_APP_URL`、`ALLOWED_HOSTS`。
- 确认宿主机数据目录已挂载并定期备份。
- 确认 `/static/uploads/...` 文件可以访问。
- 如果需要邮件回执，配置 SMTP。
- 如果需要 AI 翻译/导入，在后台配置 AI API。
- 修改任何 `NEXT_PUBLIC_*` 后重建前端。
