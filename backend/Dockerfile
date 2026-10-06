# syntax=docker/dockerfile:1.7
# Build context is the repo's backend/ directory (Render "Root Directory" = backend). Build locally
# from backend/ with:
#   docker build --secret id=PACKAGES_READ_TOKEN,env=PACKAGES_READ_TOKEN -t animstudio-api .

# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# The csproj files fall back to sibling ProjectReferences when the private feed is unavailable.
# A container has no siblings, so force the registry PackageReferences. Passed as global
# properties, these override the conditions inside the csproj files for restore AND publish.
ARG MSBUILD_PACKAGE_PROPS="-p:UseLocalProjectReferences=false -p:SkipPrivatePackages=false"

# Restore first (layer-cached) using only the project files + NuGet source config.
COPY nuget.config ./
COPY AnimStudio.Domain/AnimStudio.Domain.csproj                 AnimStudio.Domain/
COPY AnimStudio.Application/AnimStudio.Application.csproj       AnimStudio.Application/
COPY AnimStudio.Infrastructure/AnimStudio.Infrastructure.csproj AnimStudio.Infrastructure/
COPY AnimStudio.Api/AnimStudio.Api.csproj                       AnimStudio.Api/

# The private KeshavSingh.* packages need PACKAGES_READ_TOKEN. On Render, add it as a Secret File
# named PACKAGES_READ_TOKEN (build secrets can't come from env vars); the mount below reads it
# without baking it into any image layer.
RUN --mount=type=secret,id=PACKAGES_READ_TOKEN,required=false \
    if [ -f /run/secrets/PACKAGES_READ_TOKEN ]; then \
        export PACKAGES_READ_TOKEN="$(cat /run/secrets/PACKAGES_READ_TOKEN)"; \
    elif [ -z "${PACKAGES_READ_TOKEN:-}" ]; then \
        echo "PACKAGES_READ_TOKEN is required to restore private GitHub Packages." >&2; \
        exit 1; \
    fi \
    && dotnet restore AnimStudio.Api/AnimStudio.Api.csproj --configfile /src/nuget.config $MSBUILD_PACKAGE_PROPS

# Then copy the sources and publish (no second restore).
COPY . .
RUN dotnet publish AnimStudio.Api/AnimStudio.Api.csproj -c Release -o /app/publish \
    -p:UseAppHost=false --no-restore $MSBUILD_PACKAGE_PROPS

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# ffmpeg/ffprobe do every render (the app requires 6.0+). DejaVu is the subtitle font named in
# appsettings and the face the watermark auto-detect finds; fontconfig lets drawtext resolve it.
# setpriv (util-linux, already in the base image) drops root in the entrypoint.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# All studio data (projects, uploads, renders, scratch, clip cache, logs) lives under one root,
# which on Render is the persistent disk mounted here.
ENV DATA_ROOT=/var/data
RUN mkdir -p "$DATA_ROOT" && chown "$APP_UID:$APP_UID" "$DATA_ROOT"

EXPOSE 8080

# Starts as root only to make the mounted disk writable, then runs the app as the image's
# unprivileged "app" user (see docker-entrypoint.sh).
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
