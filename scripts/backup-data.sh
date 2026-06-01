#!/usr/bin/env sh
set -eu

DATA_DIR="${1:-../mulandance-data}"
BACKUP_ROOT="${2:-../mulandance-backups}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$BACKUP_ROOT/mulandance-data-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_ROOT"
tar -czf "$ARCHIVE" -C "$DATA_DIR" .
echo "Backup written to $ARCHIVE"
