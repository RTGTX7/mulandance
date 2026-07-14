from pydantic import BaseModel


class BackupInfo(BaseModel):
    filename: str
    size: int
    created_at: str
    format_version: int = 1
    app_version: str = ""
    schema_revision: str = ""


class BackupListResponse(BaseModel):
    items: list[BackupInfo]


class BackupRestoreResponse(BaseModel):
    message: str
    pre_restore_backup: str
    restored_database: bool
    restored_files: int
