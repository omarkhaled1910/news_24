# Multi-process Dockerfile for Fly.io - Runs both MongoDB and Next.js app
FROM node:22.17.0-alpine AS base

# Install MongoDB and dependencies
RUN apk add --no-cache \
    libc6-compat \
    mongodb \
    mongodb-tools \
    python3 \
    py3-pip \
    && pip3 install --no-cache-dir honcho

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --ignore-scripts; \
  elif [ -f package-lock.json ]; then npm ci --ignore-scripts; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile --ignore-scripts; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment for build
ENV NODE_ENV production
ENV PAYLOAD_SECRET=temp-build-secret
ENV DATABASE_URL=mongodb://localhost:27018/news_24

RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Production image with MongoDB and app
FROM base AS runner

ENV NODE_ENV production
ENV DATABASE_URL=mongodb://localhost:27017/news_24
ENV PORT 3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser -D -u 1001 -G nodejs nextjs

# Create MongoDB data directory with proper permissions
RUN mkdir -p /data/db && \
    chown -R nextjs:nodejs /data/db

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Procfile for honcho
COPY Procfile ./Procfile

# Set permissions
RUN chown -R nextjs:nodejs /app

# Create volume for MongoDB persistence
VOLUME ["/data/db"]

USER nextjs

EXPOSE 3000

# Use honcho to run both MongoDB and the app (defined in Procfile)
CMD honcho start -f Procfile
