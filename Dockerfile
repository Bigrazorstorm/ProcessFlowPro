# Dockerfile for ProcessFlow Pro Backend
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

# Build shared types
WORKDIR /app/packages/shared-types
RUN pnpm run build

# Build backend
WORKDIR /app/apps/backend
RUN pnpm run build

# Production stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/src/database/migrations ./apps/backend/src/database/migrations
COPY --from=builder /app/apps/backend/src/database/entities ./apps/backend/src/database/entities
COPY --from=builder /app/apps/backend/src/database/seeders ./apps/backend/src/database/seeders
COPY --from=builder /app/apps/backend/src/database/data-source.ts ./apps/backend/src/database/data-source.ts
COPY --from=builder /app/packages/shared-types ./packages/shared-types

# Set working directory to backend
WORKDIR /app/apps/backend

# Expose port
EXPOSE 3000

# Start application (uses startup.mjs which handles migrations and seeding)
CMD ["pnpm", "run", "start:prod"]
