# Docker Usage Guide

This guide walks through running the Snack Builder Bakery API and its observability stack with Docker Compose. No local Node.js installation is required.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose v2)
- Ports 3000 and 9090 free on your machine

Verify Docker is running:

```bash
docker --version
docker compose version
```

## Services

| Service      | Port | Description                                      |
|--------------|------|--------------------------------------------------|
| `api`        | 3000 | The NestJS bakery API                            |
| `prometheus` | 9090 | Prometheus scrapes `/metrics` every 15 seconds   |

## Step 1: Build and start

From the `SnackBuilderBakery/` root (the same directory that contains `docker-compose.yml` and `package.json`):

```bash
# Build with the version from package.json (recommended)
APP_VERSION=$(node -p "require('./package.json').version") docker compose up -d

# Or just start without a version label (defaults to "dev")
docker compose up -d
```

Docker builds the API image from the [Dockerfile](../Dockerfile) and starts both services in the background. The first build takes a minute while it installs dependencies and compiles TypeScript; subsequent starts are instant.

Confirm both services are up:

```bash
docker compose ps
```

Expected output:

```
NAME                    STATUS    PORTS
snackbuilderbakery-api-1          Up        0.0.0.0:3000->3000/tcp
snackbuilderbakery-prometheus-1   Up        0.0.0.0:9090->9090/tcp
```

## Step 2: Verify the API

Check which version of the project is running:

```bash
curl http://localhost:3000/version
# {"version":"0.1.0"}
```

On `master` with no `APP_VERSION` set this returns `"dev"`. When built with the one-liner from Step 1 it returns the version from `package.json`. On a feature branch the version is whatever `package.json` says on that branch.

To run an older release, tag the image after a successful build and reference the tag later:

```bash
# after building 0.1.0
docker tag snackbuilderbakery-api:latest snackbuilderbakery-api:0.1.0

# run 0.1.0 any time later
APP_VERSION=0.1.0 docker compose up -d
```

```bash
curl http://localhost:3000/menu
```

You should receive an empty array `[]` (no menu items yet).

Place an order end to end:

```bash
# Add a menu item
curl -s -X POST http://localhost:3000/menu \
  -H "Content-Type: application/json" \
  -d '{"name":"Chocolate Chip","category":"Cookie","price":250}' | jq .

# Place an order (copy the menuItemId from the response above)
curl -s -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuItemId":"<id>","quantity":1}],"source":"WalkIn"}' | jq .
```

## Step 3: Stream logs

Every request the API handles emits a structured JSON log line to stdout. Read them live:

```bash
docker compose logs -f api
```

Sample output:

```json
{"level":30,"time":1700000000000,"pid":1,"hostname":"abc123","req":{"method":"GET","url":"/menu"},"res":{"statusCode":200},"responseTime":2,"msg":"request completed"}
```

Press `Ctrl+C` to stop following. To see the last 50 lines without following:

```bash
docker compose logs --tail=50 api
```

## Step 4: Check metrics

The API exposes a Prometheus-format metrics endpoint:

```bash
curl http://localhost:3000/metrics
```

This returns Node.js process and event-loop metrics in plain text. Prometheus scrapes this endpoint automatically every 15 seconds.

Open the Prometheus UI in your browser:

```
http://localhost:9090
```

To query a metric, go to the **Graph** tab and enter an expression, for example:

```
nodejs_eventloop_lag_seconds
```

Click **Execute** to see the current value, or switch to the **Graph** tab to see it over time.

To confirm Prometheus is scraping the API successfully, go to:

```
http://localhost:9090/targets
```

The `bakery-api` target should show **State: UP**.

## Step 5: Rebuild after code changes

If you change application code and want to pick up the changes in Docker:

```bash
docker compose up -d --build
```

This rebuilds the `api` image and restarts only that service. Prometheus is unaffected.

## Step 6: Tear down

Stop and remove containers (data is in-memory so nothing is persisted):

```bash
docker compose down
```

To also remove the built image:

```bash
docker compose down --rmi local
```

## Troubleshooting

**Port already in use:**
Another process is on port 3000 or 9090. Find and kill it, then retry:
```bash
# find what is holding the port (replace 3000 with 9090 if needed)
lsof -i :3000
kill <PID>
```
Or just override the API port without touching the other process:
```bash
PORT=3001 docker compose up -d
```

**`docker compose` not found:**
You may have an older Docker with `docker-compose` (hyphenated). Upgrade to Docker Desktop v4+ for the `docker compose` plugin.

**Prometheus target shows DOWN:**
The API may still be starting. Wait a few seconds and refresh `http://localhost:9090/targets`. If it stays DOWN, check the API logs:
```bash
docker compose logs api
```
