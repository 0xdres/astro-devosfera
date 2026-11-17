---
title: "Docker Compose en 2026: buenas prácticas que realmente importan"
description: Más allá del clásico docker-compose up. Configuraciones de producción, secretos, healthchecks, perfiles y compilaciones multi-stage que marcan la diferencia.
pubDatetime: 2026-02-05T10:00:00Z
tags:
  - docker
  - devops
  - contenedores
  - backend
draft: false
---

`docker-compose up` es el primer comando que aprendes. Lo que viene después — redes, secretos, healthchecks, perfiles para diferentes entornos — es lo que separa una configuración funcional de una lista para producción.

## Estructura base limpia

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

## Compilaciones multi-stage: menos MBs, más seguridad

Un Dockerfile de producción nunca debería incluir herramientas de desarrollo:

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

La diferencia de tamaño puede ser de **600 MB → 80 MB**.

## Perfiles para diferentes entornos

Con `profiles` puedes activar servicios según el contexto sin tener que mantener múltiples archivos de Compose:

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

## Healthchecks que realmente funcionan

El `depends_on` básico solo espera a que el contenedor se **inicie**, no a que el servicio esté **listo**. La diferencia importa:

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

## Redes: aislamiento por defecto

Cada `compose.yml` crea su propia red. Para comunicar stacks independientes:

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

## Lista de verificación antes de producción

- [ ] Variables sensibles en `secrets` o `.env` fuera del repositorio
- [ ] Compilación multi-stage activa
- [ ] `restart: unless-stopped` en todos los servicios críticos
- [ ] Healthchecks configurados con el `start_period` adecuado
- [ ] `depends_on` con `condition: service_healthy`
- [ ] Usuarios no root en los contenedores (`USER node`, `USER app`)
- [ ] Volúmenes con nombre para datos persistentes (sin bind mounts en producción)
- [ ] `--max-old-space-size` configurado de acuerdo con la memoria del contenedor

> La diferencia entre un `compose.yml` de tutorial y uno de producción no está en el número de líneas, sino en saber qué puede fallar y haberlo tenido en cuenta.
