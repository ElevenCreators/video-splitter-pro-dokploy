# ... (tu Stage builder queda igual)

FROM jrottenberg/ffmpeg:7.1-ubuntu2404 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/* || true

# Bun del builder
COPY --from=builder /usr/local/bin/bun /usr/local/bin/

# Artefactos Next
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
# Si tienes /public o next.config.*:
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/next.config.* ./

# Crea carpeta temporal para tu API si la usas
RUN mkdir -p /app/temp

# Verificación ffmpeg
RUN command -v ffmpeg && ffmpeg -version | head -1

EXPOSE 3000

# Healthcheck para que Dokploy detecte si el server realmente está arriba
HEALTHCHECK --interval=20s --timeout=5s --retries=5 CMD curl -fsS http://127.0.0.1:${PORT}/ || exit 1

CMD ["bun", "start"]
