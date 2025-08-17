# syntax=docker/dockerfile:1.6

FROM oven/bun:1.2.19 AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl bash && rm -rf /var/lib/apt/lists/*
COPY package.json bun.lock* ./
RUN ["/usr/local/bin/bun", "install", "--frozen-lockfile"]
COPY . .
RUN ["/usr/local/bin/bun", "run", "build"]

FROM jrottenberg/ffmpeg:7.1-ubuntu2404 AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
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
ENV PATH="/usr/local/bin:${PATH}"
EXPOSE 3000
CMD ["bun","run","start:production"]
