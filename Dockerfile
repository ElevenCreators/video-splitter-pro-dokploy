FROM node:18-alpine

# Install ffmpeg and other dependencies
RUN apk add --no-cache ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies with bun
RUN npm install -g bun
RUN bun install

# Copy source code
COPY . .

# Create temp directory for video processing
RUN mkdir -p temp

# Build the application
RUN bun run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "start"]
