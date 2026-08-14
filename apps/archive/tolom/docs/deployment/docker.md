---
title: Docker Deployment
desc: Self-hosting with Docker
---

# Docker Deployment

## Prerequisites

- Docker
- Docker Compose (optional)

## Quick Start

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run docs:build

FROM nginx:alpine
COPY --from=builder /app/docs/.vitepress/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  docs:
    build: .
    ports:
      - "8080:80"
```

```bash
# Build and run
docker build -t docs .
docker run -p 8080:80 docs
# Or with compose:
docker compose up -d
```
