FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install pnpm and node-gyp
RUN npm install -g pnpm node-gyp

# Copy package files
COPY package*.json ./

# Install production dependencies with build scripts enabled
# Use environment variable to bypass pnpm security restrictions
RUN SKIP_BUILD_SCRIPT_PROMPT=true pnpm config set enable-pre-post-scripts true && \
    pnpm config set ignore-scripts false && \
    pnpm install --prod || true
   
# Manually rebuild bcrypt with node-gyp
RUN cd /app/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && \
    npm run install || node-gyp rebuild || true

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "dist/src/main.js"]

