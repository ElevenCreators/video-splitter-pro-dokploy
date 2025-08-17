# --- Stage 0: proveedor de FFmpeg (version-pinned)
ARG FFMPEG_TAG=7.1-alpine
FROM jrottenberg/ffmpeg:${FFMPEG_TAG} AS ffmpeg

# --- Stage 1: builder (Bun oficial)
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# deps mínimas
RUN apk add --no-cache bash curl

# caché e instalación determinística
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile

# copia código y build
COPY . .
RUN bun run build

# --- Stage 2: runtime (Bun + FFmpeg del stage 0)
FROM oven/bun:1-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Copiamos binarios exactos de FFmpeg y FFprobe
COPY --from=ffmpeg /usr/local/bin/ffmpeg /usr/local/bin/ffprobe /usr/local/bin/

# app no-root + temp
RUN addgroup -S app && adduser -S app -G app \
 && mkdir -p /app/temp && chown -R app:app /app

# sólo lo necesario para correr
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./

# variables explícitas
ENV FFMPEG_PATH=/usr/local/bin/ffmpeg
ENV FFPROBE_PATH=/usr/local/bin/ffprobe
ENV PATH="/usr/local/bin:${PATH}"

# verificación
RUN $FFMPEG_PATH -version && $FFPROBE_PATH -version

EXPOSE 3000
USER app
CMD ["bun", "start"]
