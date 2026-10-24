#!/bin/sh
set -e

# A persistent disk is mounted over $DATA_ROOT at runtime. On free or non-root servers,
# missing permissions or tools must not prevent the API server from booting.
DATA_ROOT="${DATA_ROOT:-/var/data}"
mkdir -p "$DATA_ROOT" 2>/dev/null || true

if [ "$(id -u)" = "0" ]; then
    if [ -n "$APP_UID" ] && [ "$(stat -c %u "$DATA_ROOT" 2>/dev/null || echo 0)" != "$APP_UID" ]; then
        chown -R "$APP_UID:$APP_UID" "$DATA_ROOT" 2>/dev/null || true
    fi
    if command -v setpriv >/dev/null 2>&1 && [ -n "$APP_UID" ]; then
        exec setpriv --reuid="$APP_UID" --regid="$APP_UID" --clear-groups dotnet AnimStudio.Api.dll "$@" 2>/dev/null || exec dotnet AnimStudio.Api.dll "$@"
    fi
fi

exec dotnet AnimStudio.Api.dll "$@"
