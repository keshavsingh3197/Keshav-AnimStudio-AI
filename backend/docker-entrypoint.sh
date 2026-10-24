#!/bin/sh
set -e

# Ensure data directory exists and is writable on any server environment (free or persistent disk)
DATA_ROOT="${DATA_ROOT:-/var/data}"
mkdir -p "$DATA_ROOT" 2>/dev/null || true
chmod 777 "$DATA_ROOT" 2>/dev/null || true

if [ "$(id -u)" = "0" ] && [ -n "$APP_UID" ]; then
    chown -R "$APP_UID:$APP_UID" "$DATA_ROOT" 2>/dev/null || true
fi

echo "==> Starting AnimStudio API..."
exec dotnet AnimStudio.Api.dll "$@"
