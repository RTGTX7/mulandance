param(
    [string]$DataDir = "../mulandance-data",
    [string]$BackupRoot = "../mulandance-backups"
)

$resolvedDataDir = Resolve-Path -LiteralPath $DataDir -ErrorAction Stop
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$resolvedBackupRoot = New-Item -ItemType Directory -Force -Path $BackupRoot
$archivePath = Join-Path $resolvedBackupRoot.FullName "mulandance-data-$timestamp.zip"

Compress-Archive -Path (Join-Path $resolvedDataDir.Path "*") -DestinationPath $archivePath -Force
Write-Host "Backup written to $archivePath"
