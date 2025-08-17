# --- Stage 1: builder (Bun)
FROM oven/bun:1 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates bash curl && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun bun install --frozen-lockfile
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# --- Stage 2: runtime = ffmpeg + (copio bun y mi app)
# Elige una etiqueta estable. Ej: 7.1-ubuntu2404 o 7.1-alpine320
ARG FFMPEG_TAG=7.1-ubuntu2404
FROM jrottenberg/ffmpeg:7.1-ubuntu2404 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Herramientas mínimas
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/* || true

# Copio el binario de Bun desde el builder
COPY --from=builder /usr/local/bin/bun /usr/local/bin/

# Copio artefactos de ejecución
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./

# ffmpeg ya está en la imagen runtime; deja que tu helper lo encuentre con `which`
# (o, si quieres fijarlo: ENV FFMPEG_PATH=/usr/local/bin/ffmpeg ; FFPROBE_PATH=/usr/local/bin/ffprobe)

# Verificación útil durante el build
RUN command -v ffmpeg && ffmpeg -version | head -1

EXPOSE 3000
CMD ["bun", "start"]
