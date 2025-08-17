# syntax=docker/dockerfile:1.6

# --- versiones pinneadas ---
ARG BUN_VER=1.2.19
ARG FFMPEG_TAG=7.1-ubuntu2404

# ========== STAGE 1: BUILDER (Bun) ==========
FROM oven/bun:${BUN_VER} AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash \
  && rm -rf /var/lib/apt/lists/*

# Evitar check de FFmpeg en build-time
ENV SKIP_FFMPEG_CHECK=1 \
    NEXT_TELEMETRY_DISABLED=1

# deps primero para cache
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile

# código y build (Next genera .next)
COPY . .
RUN bun run build

# ========== STAGE 2: FFmpeg provider ==========
FROM jrottenberg/ffmpeg:${FFMPEG_TAG} AS ffmpeg

# ========== STAGE 3: RUNTIME (Node 20 + FFmpeg 7.1) ==========
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Copiamos FFmpeg y sus libs desde el proveedor
COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/ffprobe /usr/local/bin/
COPY --from=ffmpeg /usr/local/lib/ /usr/local/lib/
ENV LD_LIBRARY_PATH=/usr/local/lib:${LD_LIBRARY_PATH}

# Artefactos de ejecución Next
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules

# Verificación
RUN node -v && command -v ffmpeg && ffmpeg -version | head -1

EXPOSE 3000

# Healthcheck sencillo
HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000),r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Arranque con Node (no Bun) para Next en 0.0.0.0:3000
CMD ["node","node_modules/next/dist/bin/next","start","-H","0.0.0.0","-p","3000"]
