# syntax=docker/dockerfile:1.6

########## BUILDER ##########
FROM oven/bun:1.2.19 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock* ./
RUN ["/usr/local/bin/bun", "install", "--frozen-lockfile"]
COPY . .
RUN ["/usr/local/bin/bun", "run", "build"]

########## RUNTIME ##########
FROM jrottenberg/ffmpeg:7.1-ubuntu2404 AS runtime
WORKDIR /app

# Node para ejecutar Next.js
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

# Bun opcional (no se usa para start, pero lo dejamos)
COPY --from=builder /usr/local/bin/bun /usr/local/bin/

# Artefactos de build y deps
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
# Si NO tienes /public, borra esta línea
COPY --from=builder /app/public ./public

# FFmpeg ya está en esta imagen
ENV FFMPEG_PATH=/usr/local/bin/ffmpeg
ENV PATH="/usr/local/bin:${PATH}"
# En caso de que Dokploy use PORT, la fijamos igualmente
ENV PORT=3000

# Carpeta temporal de trabajo
RUN mkdir -p /app/temp

EXPOSE 3000

# HEALTHCHECK contra nuestro endpoint
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
  CMD curl -fsS "http://localhost:3000/api/health" || exit 1

# Arranque: Next escucha en 0.0.0.0:3000
CMD ["node","node_modules/next/dist/bin/next","start","-H","0.0.0.0","-p","3000"]
