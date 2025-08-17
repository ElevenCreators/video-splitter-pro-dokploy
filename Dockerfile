# syntax=docker/dockerfile:1.6

# --- versiones pinneadas ---
ARG BUN_VER=1.2.19
ARG FFMPEG_TAG=7.1-ubuntu2404

# ========== STAGE 1: BUILDER (debe ir PRIMERO) ==========
FROM oven/bun:${BUN_VER} AS builder
WORKDIR /app

# utilidades básicas
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash \
  && rm -rf /var/lib/apt/lists/*

# evita que tu helper busque ffmpeg en build-time (solo en builder)
ENV SKIP_FFMPEG_CHECK=1 \
    NEXT_TELEMETRY_DISABLED=1

# deps primero para caching
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile

# código y build (Next genera .next)
COPY . .
RUN bun run build

# ========== STAGE 2: RUNTIME (FFmpeg 7.1 ya instalado) ==========
FROM jrottenberg/ffmpeg:${FFMPEG_TAG} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000

# utilidades mínimas para healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* || true

# copia bun desde builder (misma versión que tu local)
COPY --from=builder /usr/local/bin/bun /usr/local/bin/

# artefactos de ejecución de Next
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
# (opcional) si existe tu config:
# COPY --from=builder /app/next.config.* ./

# verificación de FFmpeg (en esta imagen suele ser /usr/bin/ffmpeg)
RUN command -v ffmpeg && ffmpeg -version | head -1

# carpeta temporal si tu API la usa
RUN mkdir -p /app/temp

EXPOSE 3000

# healthcheck simple
HEALTHCHECK --interval=20s --timeout=5s --retries=5 CMD curl -fsS http://127.0.0.1:${PORT}/ || exit 1

CMD ["bun", "start"]
