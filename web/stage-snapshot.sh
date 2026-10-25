#!/usr/bin/env bash
# stage-snapshot.sh — stage a web-build snapshot of this checkout for the
# Layout Inspector artifact.
#
# Usage:
#   web/stage-snapshot.sh <artifact-slug>
set -euo pipefail

slug="${1:-}"
if [[ -z "$slug" ]]; then
  echo "usage: $0 <artifact-slug>" >&2
  exit 2
fi
if [[ ! "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "error: invalid artifact slug: $slug" >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
dest="$HOME/workspace/ts-spaces/$slug"

if [[ -n "$(git -C "$repo_root" status --porcelain)" ]]; then
  echo "error: checkout at $repo_root has uncommitted changes." >&2
  echo "Commit or stash first: the snapshot is taken from HEAD and must match the tree." >&2
  exit 1
fi

BACKUP_DIR=""
if [[ -f "$dest/app.db" ]]; then
  stamp="$(date +%Y%m%d-%H%M%S)"
  BACKUP_DIR="$HOME/workspace/ts-spaces/.data-backups/${slug}-${stamp}"
  mkdir -p "$BACKUP_DIR"
  python3 - "$dest/app.db" "$BACKUP_DIR/app.db" <<'PY'
import sqlite3, sys
src = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
dst = sqlite3.connect(sys.argv[2])
try:
    src.backup(dst)
finally:
    dst.close()
    src.close()
PY
  echo "backed up existing app database to $BACKUP_DIR/app.db"
fi

rm -rf "$dest"
if [[ -e "$dest" ]]; then
  sleep 2
  rm -rf "$dest"
fi
if [[ -e "$dest" ]]; then
  echo "error: could not clear $dest — the artifact system may still be writing it." >&2
  exit 1
fi
mkdir -p "$dest"

git -C "$repo_root" archive HEAD -- \
  client server drizzle \
  package.json tsconfig.base.json space.json.template \
  | tar -x -C "$dest"

sed "s/__ARTIFACT_SLUG__/$slug/g" "$dest/space.json.template" > "$dest/space.json"

if [[ -n "$BACKUP_DIR" ]]; then
  cp "$BACKUP_DIR/app.db" "$dest/app.db"
  echo "restored app database from $BACKUP_DIR/app.db (backup retained at $BACKUP_DIR)"
fi

for f in space.json space.json.template package.json client server drizzle; do
  if [[ ! -e "$dest/$f" ]]; then
    echo "error: snapshot incomplete: missing $dest/$f" >&2
    exit 1
  fi
done
if ! grep -q "\"slug\": \"$slug\"" "$dest/space.json"; then
  echo "error: generated space.json does not carry slug \"$slug\"" >&2
  exit 1
fi

echo "staged snapshot for slug \"$slug\" at $dest ($(find "$dest" -type f | wc -l) files)"
