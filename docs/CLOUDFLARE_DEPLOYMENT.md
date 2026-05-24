# Cloudflare 部署指南

## 项目架构

- **前端**: Next.js 14.2.15 → Cloudflare Pages
- **后端**: FastAPI → Cloudflare Workers (Pages Functions)
- **数据库**: PostgreSQL → Cloudflare D1 (或外部 PostgreSQL)

## 部署前端 (Cloudflare Pages)

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 配置 next.config.js

```js
const nextConfig = {
  output: 'export',  // 静态导出
  images: {
    unoptimized: true,  // Cloudflare 不支持 Next.js Image Optimization
  },
};

module.exports = nextConfig;
```

### 3. 构建静态文件

```bash
cd frontend
npm run build
# 生成到 .next/static 和 out 目录
```

### 4. 部署到 Cloudflare Pages

```bash
# 方式一: 使用 Cloudflare Dashboard
# - 连接 GitHub 仓库
# - Build command: cd frontend && npm run build
# - Output directory: .next
# - Build output directory: out

# 方式二: 使用 Wrangler
npx wrangler pages deploy frontend/out --project-name=mulandance
```

## 部署后端 (Cloudflare Workers)

### 方式一: Cloudflare Pages Functions (推荐)

1. 将后端 API 转换为 Cloudflare Workers 格式
2. 使用 `api/` 目录放在 Pages 项目中

### 方式二: 外部 PostgreSQL + Cloudflare Workers

1. 使用 Supabase 或 Neon 作为 PostgreSQL
2. FastAPI 部署到 Railway/Render
3. Cloudflare 做 CDN 加速

## 最简单部署方案

### 仅部署前端到 Cloudflare Pages

1. 连接 GitHub 到 Cloudflare Pages
2. 设置环境变量:
   - `NEXT_PUBLIC_API_URL`: 你的后端 API 地址
3. 自动部署

### 后端部署选项

| 平台 | 价格 | 说明 |
|------|------|------|
| Railway | 免费额度 | 推荐，支持 PostgreSQL |
| Render | 免费额度 | 简单易用 |
| Fly.io | 免费额度 | 支持 Docker |
| Cloudflare Workers | 免费 | 需要转换代码格式 |

## 快速开始

```bash
# 1. 注册 Cloudflare 账号
# 2. 连接 GitHub 仓库到 Cloudflare Pages
# 3. 设置构建配置:
#    - Framework preset: Next.js
#    - Build command: npm run build
#    - Output directory: .next
# 4. 保存并部署
```

## 环境变量

在 Cloudflare Dashboard 设置:

```
NEXT_PUBLIC_API_URL=https://your-api-domain.workers.dev