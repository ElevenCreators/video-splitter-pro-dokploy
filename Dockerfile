# syntax=docker/dockerfile:1.6

# --- versiones pinneadas ---
ARG BUN_VER=1.2.19
ARG FFMPEG_TAG=7.1-ubuntu2404

# --- Stage 1: builder (Bun 1.2.19) ---
FROM oven/bun:${BUN_VER} AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash \
  && rm -rf /var/lib/apt/lists/*

# deps primero (usa tu lockfile commiteado)
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile

# código y build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# --- Stage 2: runtime = ffmpeg 7.1 + (copio bun 1.2.19 y mi app) ---
FROM jrottenberg/ffmpeg:${FFMPEG_TAG} AS runtime
WORKDIR /app
ENV NODE_ENV=production

# utilidades mínimas
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* || true

# bun del builder (la misma 1.2.19)
COPY --from=builder /usr/local/bin/bun /usr/local/bin/

# artefactos de ejecución
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./

# verificación: debe imprimir "ffmpeg version 7.1 ..."
RUN command -v ffmpeg && ffmpeg -version | head -1

# Si tu helper auto-detecta 'which ffmpeg', no necesitas setear estas vars.
# Si prefieres fijarlas, en esta imagen suele ser /usr/bin:
# ENV FFMPEG_PATH=/usr/bin/ffmpeg
# ENV FFPROBE_PATH=/usr/bin/ffprobe

EXPOSE 3000
CMD ["bun", "start"]