#!/bin/sh
# A persistent disk is mounted over $DATA_ROOT at runtime, and a fresh one is owned by root -
# so the ownership set in the image is hidden. Fix it once (only when it is wrong, so a large
# disk isn't walked on every boot), then drop to the unprivileged user for the app itself.
set -eu

if [ "$(id -u)" = "0" ]; then
    mkdir -p "$DATA_ROOT"
    if [ "$(stat -c %u "$DATA_ROOT")" != "$APP_UID" ]; then
        chown -R "$APP_UID:$APP_UID" "$DATA_ROOT"
    fi
    exec setpriv --reuid="$APP_UID" --regid="$APP_UID" --clear-groups dotnet AnimStudio.Api.dll "$@"
fi

exec dotnet AnimStudio.Api.dll "$@"
