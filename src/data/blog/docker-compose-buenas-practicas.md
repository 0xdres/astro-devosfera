---
title: "Docker Compose in 2026: best practices that actually matter"
description: Beyond the basic docker-compose up. Production configs, secrets, healthchecks, profiles, and multi-stage builds that make a difference.
pubDatetime: 2026-02-05T10:00:00Z
tags:
  - docker
  - devops
  - containers
  - backend
draft: false
---

`docker-compose up` is the first command you learn. What comes next — networking, secrets, healthchecks, profiles for different environments — is what separates a functional configuration from a production-ready one.

## Table of contents

## Clean base structure

```yaml file=compose.yml
name: my-app

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production # multi-stage target // [!code highlight]
    environment:
      NODE_ENV: production
    env_file: .env.production # never hardcode credentials // [!code highlight]
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy # wait for DB to be ready // [!code highlight]
    restart: unless-stopped

  db:
    image: postgres:17-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## Multi-stage builds: fewer MBs, more security

A production Dockerfile should never include development tools:

```dockerfile file=Dockerfile
# Stage 1: dependencies and build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # [!code highlight]
COPY . .
RUN npm run build

# Stage 2: minimal final image
FROM node:22-alpine AS production  # [!code ++]
WORKDIR /app                       # [!code ++]
                                   # [!code ++]
# Only copy what's necessary       # [!code ++]
COPY --from=builder /app/dist ./dist  # [!code ++]
COPY --from=builder /app/node_modules ./node_modules  # [!code ++]
                                   # [!code ++]
USER node                          # do not run as root // [!code ++]
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

The difference in size can be from **600 MB → 80 MB**.

## Profiles for different environments

With `profiles` you can activate services based on context without maintaining multiple Compose files:

```yaml file=compose.yml
services:
  api:
    # no profile = always active
    build: .

  adminer:
    image: adminer
    profiles: [dev, debug] # only in dev // [!code highlight]
    ports:
      - "8080:8080"

  prometheus:
    image: prom/prometheus
    profiles: [monitoring] # only when you need it // [!code highlight]
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

```bash
# Only bring up API + DB
docker compose up

# Bring up with dev tools
docker compose --profile dev up

# Entire monitoring stack
docker compose --profile monitoring up
```

## Healthchecks that actually work

The basic `depends_on` only waits for the container to **start**, not for the service to be **ready**. The difference matters:

```yaml file=compose.yml
services:
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s # initial grace period // [!code highlight]

  worker:
    build: .
    depends_on:
      redis:
        condition: service_healthy # wait for green healthcheck // [!code highlight]
```

## Networking: isolation by default

Every `compose.yml` creates its own network. To communicate separate stacks:

```yaml file=compose.yml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true # no internet access // [!code highlight]

services:
  nginx:
    networks: [frontend, backend] # the only one touching both networks

  api:
    networks: [backend] # isolated from the outside // [!code highlight]

  db:
    networks: [backend] # ditto
```

## Checklist before production

- [ ] Sensitive variables in `secrets` or `.env` outside the repository
- [ ] Multi-stage build active
- [ ] `restart: unless-stopped` on all critical services
- [ ] Healthchecks configured with proper `start_period`
- [ ] `depends_on` with `condition: service_healthy`
- [ ] Non-root users in containers (`USER node`, `USER app`)
- [ ] Named volumes for persistent data (no bind mounts in prod)
- [ ] `--max-old-space-size` configured according to container memory

> The difference between a tutorial `compose.yml` and a production one is not in the number of lines — it's in knowing what can fail and having accounted for it.
