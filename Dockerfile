FROM node:18-alpine

# Install system dependencies including FFmpeg
RUN apk update && apk add --no-cache \
    ffmpeg \
    ffprobe \
    bash \
    curl

# Verify FFmpeg installation and show paths
RUN echo "=== Verifying FFmpeg Installation ===" && \
    which ffmpeg && \
    ffmpeg -version | head -1 && \
    which ffprobe && \
    ls -la /usr/bin/ffmpeg* && \
    echo "=== FFmpeg installed successfully ==="

# Install bun globally
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Create temp directory with proper permissions
RUN mkdir -p temp && chmod 755 temp

# Set FFmpeg environment variables explicitly
ENV FFMPEG_PATH=/usr/bin/ffmpeg
ENV FFPROBE_PATH=/usr/bin/ffprobe
ENV PATH="/usr/bin:${PATH}"

# Verify FFmpeg is accessible after environment setup
RUN echo "=== Final FFmpeg Check ===" && \
    $FFMPEG_PATH -version | head -1 && \
    echo "FFmpeg ready for use"

# Build the application
RUN bun run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "start"]
