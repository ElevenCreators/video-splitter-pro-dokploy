# syntax=docker/dockerfile:1.6

########## BUILDER ##########
FROM oven/bun:1.2.19 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock* ./
RUN ["/usr/local/bin/bun","install","--frozen-lockfile"]
COPY . .
RUN ["/usr/local/bin/bun","run","build"]

########## RUNTIME ##########
FROM jrottenberg/ffmpeg:7.1-ubuntu2404 AS runtime
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/bin/bun /usr/local/bin/
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

ENV FFMPEG_PATH=/usr/local/bin/ffmpeg
ENV HOST=0.0.0.0
ENV PATH="/usr/local/bin:${PATH}"
RUN mkdir -p /app/temp
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=4s --start-period=60s --retries=10 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["node","node_modules/next/dist/bin/next","start","-H","0.0.0.0","-p","3000"]
