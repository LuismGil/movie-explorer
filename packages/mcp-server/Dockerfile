# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 3: Runner
FROM gcr.io/distroless/nodejs20-debian12 AS runner
WORKDIR /app
ENV NODE_ENV=production
# MCP_HOST defaults to 0.0.0.0 in Docker so it is accessible from outside
ENV MCP_HOST=0.0.0.0

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Non-root user provided by distroless
USER nonroot:nonroot

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD ["/nodejs/bin/node", "-e", "const port=Number(process.env.MCP_PORT || process.env.PORT || 3001); const req=require('node:http').get('http://127.0.0.1:'+port+'/health', (res) => { res.resume(); if (res.statusCode !== 200) process.exit(1); }); req.on('error', () => process.exit(1));"]

CMD ["dist/index.js"]
