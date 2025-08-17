# syntax=docker/dockerfile:1.6

# --- versiones pinneadas ---
ARG BUN_VER=1.2.19
ARG FFMPEG_TAG=7.1-ubuntu2404

# --- Stage 1: builder (Bun 1.2.19) ---
FROM oven/bun:${BUN_VER} AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash \
  && rm -rf /var/lib/apt/lists/*

# evita que tu helper busque ffmpeg durante el build
ENV SKIP_FFMPEG_CHECK=1
ENV NEXT_TELEMETRY_DISABLED=1

# deps primero
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile

# código y build
COPY . .
RUN bun run build  # Next genera .next

# --- Stage 2: runtime = ffmpeg 7.1 + (copio bun y mi app) ---
FROM jrottenberg/ffmpeg:${FFMPEG_TAG} AS runtime
WORKDIR /app
ENV NODE_ENV=production

# utilidades mínimas
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* || true

# bun del builder (misma versión)
COPY --from=builder /usr/local/bin/bun /usr/local/bin/

# artefactos de ejecución (Next)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./
# si tienes /public o next.config.*, cópialos también:
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/next.config.* ./

# node_modules: si tu build los necesita en runtime, cópialos
COPY --from=builder /app/node_modules ./node_modules

# verificación (aquí sí hay ffmpeg)
RUN command -v ffmpeg && ffmpeg -version | head -1
# en estas imágenes suele ser /usr/bin/ffmpeg:
# ENV FFMPEG_PATH=/usr/bin/ffmpeg
# ENV FFPROBE_PATH=/usr/bin/ffprobe

EXPOSE 3000
CMD ["bun", "start"]
