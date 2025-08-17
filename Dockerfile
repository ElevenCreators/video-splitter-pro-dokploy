# syntax=docker/dockerfile:1.6

# --- versiones pinneadas ---
ARG BUN_VER=1.2.19

# ========== STAGE 1: BUILDER (Bun) ==========
FROM oven/bun:${BUN_VER} AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash \
  && rm -rf /var/lib/apt/lists/*

# Evita búsquedas de FFmpeg en build-time
ENV SKIP_FFMPEG_CHECK=1 \
    NEXT_TELEMETRY_DISABLED=1

# deps primero (cache)
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile

# código y build (Next genera .next)
COPY . .
RUN bun run build

# ========== STAGE 2: RUNTIME (Ubuntu 24.04 + FFmpeg 7.1 + Node 20) ==========
FROM jrottenberg/ffmpeg:7.1-ubuntu2404 AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Instala Node 20 con NodeSource (mismo sistema que la imagen de FFmpeg)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

# Artefactos de ejecución (NO copiamos ninguna lib del sistema desde otra imagen)
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
# Si tienes carpeta public/, descomenta:
# COPY --from=builder /app/public ./public

# Comprobación en build
RUN node -v && command -v ffmpeg && ffmpeg -version | head -1

# Carpeta temporal si tu API escribe archivos
RUN mkdir -p /app/temp

EXPOSE 3000

# Healthcheck simple
HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000),r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Arranque con Node (Next oficial), escuchando en 0.0.0.0
CMD ["node","node_modules/next/dist/bin/next","start","-H","0.0.0.0","-p","3000"]
