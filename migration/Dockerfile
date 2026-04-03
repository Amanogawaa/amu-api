# Use official Bun image as base (full registry URL for Podman compatibility)
# Using latest version for lockfile compatibility
FROM docker.io/oven/bun:latest AS base

# Set working directory
WORKDIR /app

# Copy package files (bun.lock for older versions, bun.lockb for newer)
COPY package.json bun.lock* bun.lockb* ./

# Install dependencies
FROM base AS install
# Install without frozen lockfile to handle version mismatches
RUN bun install --production

# Copy source code
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port (default 8080)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun --version || exit 1

# Run the server using bun
CMD ["bun", "run", "src/server.ts"]
