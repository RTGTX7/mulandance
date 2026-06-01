# AI 内容功能

本文档记录当前 AI 接入情况和后续计划。

## 当前状态

已实现：

- 后台系统设置里可填写 OpenAI 兼容 API。
- 后端 AI client 调用 `/chat/completions`。
- AI 翻译接口。
- URL 导入生成新闻草稿接口。
- 新闻编辑器里的 AI 草稿助手。
- 导入图片会下载到配置的上传目录。

部分实现：

- 新闻编辑器已经能使用 AI 翻译和 URL 导入。
- 其它后台模块有多语言编辑，但还没有全部接入一键 AI 生成按钮。

未实现：

- AI 操作审计日志。
- 应用 AI 前自动生成 rollback snapshot。
- 每个后台编辑器都有 AI 按钮。
- 对小红书、Instagram 等平台做浏览器自动抓取。

## 配置

AI 可以在后台配置：

```text
Admin -> System Settings -> AI API Connection
```

环境变量是后备默认值：

```env
AI_ENABLED=false
AI_PROVIDER=openai_compatible
AI_API_BASE_URL=https://api.openai.com/v1
AI_API_KEY=
AI_MODEL=
AI_TIMEOUT_SECONDS=60
AI_MAX_URLS=10
AI_MAX_IMAGES_PER_URL=5
```

规则：

- API Key 只保存在后端。
- 前端不能直接请求 AI 服务商。
- 保存时 API Key 留空表示保留旧 key。
- 清空 key 必须使用系统设置里的清空选项。

## 后端文件

- `backend/app/api/v1/ai.py`
- `backend/app/services/ai_translation.py`
- `backend/app/services/ai_article_generator.py`
- `backend/app/services/url_importer.py`
- `backend/app/core/ai_translation_rules.py`
- `backend/app/schemas/ai.py`

## API 接口

### 翻译内容

```text
POST /api/v1/ai/translate
```

用于把允许的内容字段从一个语言翻译到一个或多个目标语言。

AI 输出只返回草稿，不直接写数据库。

### URL 导入文章草稿

```text
POST /api/v1/ai/import-article-urls
```

新闻编辑器用这个接口处理一个或多个 URL，以及可选的手动补充文字。

后端会：

- 校验 URL 必须是公开地址
- 拒绝 localhost 和内网地址
- 尽量读取公开 metadata 和页面文本
- 下载允许的图片类型
- 把导入图片保存到 `UPLOADS_DIR`
- 调用 AI 生成中英法新闻草稿
- 把草稿返回给后台界面

## 新闻编辑器流程

1. 管理员打开新闻编辑器。
2. 管理员填写原文，或输入 URL/手动文字。
3. 点击 AI 草稿助手。
4. 后端生成翻译草稿或文章草稿。
5. 前端把草稿显示在编辑器里。
6. 管理员检查和修改。
7. 管理员再用普通保存按钮保存文章。

这样 AI 不会直接覆盖正式内容。

## 安全规则

AI 可以生成或翻译：

- 标题
- 摘要
- 正文
- 描述
- 名称
- 角色展示文字
- 简历/介绍文字
- 标签和说明
- Markdown 政策文本

AI 不允许修改：

- id
- slug，除非编辑器明确创建新文章草稿
- URL
- 图片 URL，后端导入返回的媒体除外
- 权限
- 角色
- 密码
- 价格数字结构
- 发布状态
- 时间戳

## URL 导入限制

普通公开网页一般可以读取。

小红书、Instagram 等平台可能失败，或者只能读取标题/图片 metadata，原因包括：

- 需要登录
- 内容由前端动态渲染
- 阻止服务器抓取
- 有反爬机制

这类来源建议流程：

1. 粘贴 URL。
2. 把复制出来的原始文案放进手动补充框。
3. 让 AI 生成中英法新闻草稿。
4. 管理员检查后手动保存。

## 后续计划

- 首页、活动演出、课程、排课表、教师、教室内容、系统政策编辑器增加 AI 按钮。
- 增加 AI 操作日志。
- 应用 AI 内容前保存旧版本 snapshot。
- 增加草稿对比弹窗。
- URL 导入增加更清楚的逐条状态和重试。
