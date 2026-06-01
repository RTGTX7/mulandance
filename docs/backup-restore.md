# 网站内容备份与恢复

本功能用于解决“代码在 GitHub，但网站内容和上传文件不能跟着代码丢”的问题。

## 已实现

- 后台入口：`系统管理 / 系统设置 / 网站设置与内容备份`
- 权限：仅 `super_admin` 可以导出或恢复完整快照
- 导出接口：`GET /api/v1/backups/export`
- 恢复接口：`POST /api/v1/backups/restore`
- 服务器本地快照列表：`GET /api/v1/backups/list`

## 快照包含

- SQLite 数据库：当前后端使用的 `DATABASE_URL` 指向的数据库文件
- `data/` 目录中的内容文件：
  - `data/news`
  - `data/pages`
  - `data/uploads`
  - 以后新增在 `data/` 下的内容目录
- 不包含：`data/backups`，避免备份包递归套备份包

导出的 zip 内部结构：

```text
manifest.json
database.sqlite
data/
```

`manifest.json` 会记录备份格式版本、创建时间、文件数量和大小，用于后续兼容检查。

## 恢复策略

恢复上传的 zip 前，系统会自动先创建一份 `pre-restore` 快照并保存在：

```text
data/backups/
```

随后执行：

- 用备份包里的 `database.sqlite` 覆盖当前 SQLite 数据库内容
- 清空当前 `data/` 目录中除 `data/backups` 外的内容
- 将备份包里的 `data/` 内容复制回来

如果恢复后浏览器仍显示旧数据，重启后端和前端服务。

## Docker 升级建议

升级前做两层保护：

1. 后台导出一份完整快照 zip，下载到本地电脑或云盘。
2. 服务器上把持久化数据目录再复制一份。

示例：

```bash
docker compose down
cp -a "$HOST_DATA_DIR" "$HOST_DATA_DIR.backup.$(date +%Y%m%d-%H%M%S)"
git pull
docker compose build --pull
docker compose up -d
```

不要把生产数据只放在源码目录里。推荐：

```env
HOST_DATA_DIR=/srv/mulandance-data
DATA_DIR=/app/data
DATABASE_URL=sqlite:////app/data/app.db
```

这样重新 `git pull`、重建镜像、甚至重新 clone 代码，都不会删除业务数据。
