#!/usr/bin/env bash
# ProcessFlow Pro – Automated Backup Script
# Usage: ./scripts/backup.sh [--env-file <path>]
# 
# Environment variables (or provide via .env file):
#   BACKUP_DIR          Directory to store backups (default: ./backups)
#   DATABASE_CONTAINER  Postgres container name (default: processflowpro-postgres)
#   DATABASE_USER       Postgres user (default: postgres)
#   DATABASE_NAME       Postgres database (default: processflowpro)
#   RETENTION_DAYS      Days to keep backups (default: 30)

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
ENV_FILE=".env.prod"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATABASE_CONTAINER="${DATABASE_CONTAINER:-processflowpro-postgres}"
DATABASE_USER="${DATABASE_USER:-postgres}"
DATABASE_NAME="${DATABASE_NAME:-processflowpro}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/db_${DATABASE_NAME}_${TIMESTAMP}.sql.gz"

# ── Functions ──────────────────────────────────────────────────────────────────
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }
error() { log "ERROR: $*" >&2; exit 1; }

# ── Pre-flight checks ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "docker is not installed"
docker inspect "$DATABASE_CONTAINER" >/dev/null 2>&1 || error "Container '$DATABASE_CONTAINER' is not running"

mkdir -p "$BACKUP_DIR"

# ── Database backup ────────────────────────────────────────────────────────────
log "Starting database backup → $BACKUP_FILE"
docker exec "$DATABASE_CONTAINER" \
  pg_dump -U "$DATABASE_USER" "$DATABASE_NAME" \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
log "Database backup complete (${BACKUP_SIZE})"

# ── Cleanup old backups ────────────────────────────────────────────────────────
log "Removing backups older than ${RETENTION_DAYS} days …"
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
REMAINING=$(find "$BACKUP_DIR" -name "db_*.sql.gz" | wc -l)
log "Cleanup done. ${REMAINING} backup(s) retained."

log "✅ Backup finished successfully."
