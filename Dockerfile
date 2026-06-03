# Dockerfile for Osiris Redux API Gateway
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/streaming/package*.json ./packages/streaming/
COPY packages/db/package*.json ./packages/db/
COPY apps/api-gateway/package*.json ./apps/api-gateway/

RUN npm install --workspace=@osiris/shared --workspace=@osiris/streaming --workspace=@osiris/db --workspace=@osiris/api-gateway

# Copy source
COPY tsconfig.base.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/api-gateway/ ./apps/api-gateway/

# Build
RUN npm run build --workspace=@osiris/shared
RUN npm run build --workspace=@osiris/streaming
RUN npm run build --workspace=@osiris/db
RUN npm run build --workspace=@osiris/api-gateway

# Expose port
EXPOSE 4000

# Start
CMD ["node", "apps/api-gateway/dist/server.js"]