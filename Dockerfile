FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install dependencies
RUN cd server && npm install
RUN cd client && npm install

# Copy source
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build client
RUN cd client && npx vite build

# Build server
RUN cd server && npx esbuild src/index.ts --bundle --platform=node --format=esm \
    --outfile=dist/server.js \
    --external:mongoose --external:ws --external:express --external:bcryptjs --external:dotenv --external:uuid \
    --banner:js="import{createRequire}from'module';const require=createRequire(import.meta.url);"

# Production stage
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/dist/ ./server/dist/
COPY --from=builder /app/client/dist/ ./client/dist/

RUN cd server && npm install --omit=dev

# Render uses port 10000, configurable via PORT env
EXPOSE 10000

ENV HOST=0.0.0.0
ENV CLIENT_DIR=../client/dist

WORKDIR /app/server

CMD ["node", "dist/server.js"]
