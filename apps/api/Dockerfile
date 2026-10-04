FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Development stage
FROM base AS development
WORKDIR /app

# Copy from deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "run", "start:dev"]

# Production stage
FROM base AS production
WORKDIR /app

# Copy from deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "dist/main"]
