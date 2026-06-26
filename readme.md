# Snack Builder Bakery API

[![CI](https://github.com/AndSanG/SnackBuilderBakery/actions/workflows/ci.yml/badge.svg)](https://github.com/AndSanG/SnackBuilderBakery/actions/workflows/ci.yml)
[![Docker](https://img.shields.io/badge/docker-ghcr.io-blue?logo=docker)](https://github.com/AndSanG/SnackBuilderBakery/pkgs/container/snackbuilderbakery)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![Version](https://img.shields.io/badge/version-0.2.1-blue)
![Coverage](https://img.shields.io/badge/coverage-93%25-brightgreen)

Backend API for order management, storefront operations, and a priority-based kitchen scheduler.

## Features

Each feature depends on the ones above it, so the table also reflects the build order.

| #   | Feature                       | Description                                                                                                                                                                                                            |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Menu Management**           | Customers view the menu; managers add, update, and remove items                                                                                                                                                        |
| 2   | **Order Placement**           | Customers order one or more items and receive a ticket with price and estimated ready time; orders are trackable by status                                                                                             |
| 3   | **Kitchen Scheduler**         | Two ovens with 3 trays each (6 concurrent slots); items are scheduled based on bake time (Cookies 5 min, Pastries 10 min, Breads 20 min)                                                                               |
| 4   | **Capacity-Based Estimation** | `estimated_ready_time` is calculated dynamically from current oven capacity and queue state at the moment of order placement                                                                                           |
| 5   | **Priority Queuing**          | Orders carry a priority tier: VIP (Tier 1), App/Delivery (Tier 2), Walk-in (Tier 3); open slots are filled by highest priority first; VIP insertion recalculates estimated times for all queued lower-priority orders |
| 6   | **Kitchen Monitoring**        | Managers see which items are in which oven and what is waiting in the queue                                                                                                                                            |
| 7   | **Payment Management**        | Accepts cash and credit card payments against a placed order                                                                                                                                                           |

## Current Scope

The current build covers all seven features end to end: Menu Management, Order Placement, payment by cash or card (with amount validation, change, and a decline path), a priority-based Kitchen Scheduler (VIP, App/Delivery, Walk-in) with capacity-based estimation and the VIP ripple recalculation, and a Kitchen Monitoring view (which item is in which oven, and what is waiting). Persistence is backed by PostgreSQL via Prisma when `DATABASE_URL` is set; the modules fall back to in-memory implementations when it is absent (the default for tests). See [assumptions.md](docs/assumptions.md) for the simplifications this implies, and [backlog.md](docs/backlog.md) for what is deferred.

## Getting Started

Built with NestJS and TypeScript. Tests run on Jest.

**New to the codebase?** Start with [walkthrough.md](walkthrough.md) — it traces one order through every layer with annotated code and explains the two core design ideas (poll-based kitchen, Clock port).

**Reviewing the submission?** See [solution.md](solution.md) — maps every challenge requirement to where it is implemented.

### Docker (recommended)

```bash
docker compose up -d          # build and start the API + Prometheus
docker compose logs -f api    # stream structured JSON logs from the API
docker compose down           # tear down
```

- API: `http://localhost:3000`
- Prometheus metrics: `http://localhost:3000/metrics`
- Prometheus UI: `http://localhost:9090`

See [docs/docker-usage.md](docs/docker-usage.md) for Prometheus queries, port overrides, image tagging, and troubleshooting.

### Requirements (local)

- Node.js 20 or newer
- npm 10 or newer

### Install

```bash
npm install
```

### Compile

```bash
npm run build      # compile to dist/ with the Nest compiler
```

### Run

```bash
npm run start      # start the API
npm run start:dev  # start in watch mode
```

The server listens on port 3000 by default. Override with the `PORT` environment variable.

### Test

```bash
npm test                  # unit tests (random order, in-memory, no DB needed)
npm run test:cov          # with coverage report
npm run test:e2e          # HTTP end-to-end suite (spins up the NestJS app)
npm run test:integration  # Prisma repository tests (skips gracefully without DATABASE_URL)
```

### Database (local)

The unit and e2e suites run without a database. For the integration tests or to run the API locally against PostgreSQL:

```bash
# start a local Postgres instance (or use the bundled one)
docker compose up -d db

export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bakery
npm run db:migrate   # apply migrations
npm run start        # API now uses Prisma repositories
```

### Layout

```
src/             application code, one folder per feature module
docs/            design documents (requirements, contracts, decisions)
walkthrough.md   guided tour of the code, layer by layer
readme.md        this file
```

## Kitchen Rules

- **Oven capacity:** 2 ovens × 3 trays = 6 concurrent baking slots
- **Bake times:** Cookies 5 min · Pastries 10 min · Breads 20 min
- **Priority tiers:** Tier 1 VIP → Tier 2 App/Delivery → Tier 3 Walk-in
- **No preemption:** an item already baking cannot be removed from the oven regardless of incoming priority
- **VIP ripple effect:** placing a VIP order recalculates `estimated_ready_time` for all lower-priority orders currently in the queue

## Technical Constraints

- **Design patterns:** scheduling and queuing logic must be managed through explicit design patterns: no ad-hoc conditionals
- **Concurrency:** the system must handle high concurrency without race conditions, deadlocks, or data corruption
- **Time simulation:** the test suite mocks time to verify future states and scheduling flow without real-world waits
- **Observability:** Docker Compose setup with logging and metrics

## Evaluation Criteria

- Clean architecture: consistent organization, no repetition, close to language semantics
- Robust automated testing: suite verifies all scheduling and order flows
- Version control: clear commit history, incremental delivery
- Docker Compose: environment setup and observability

## Backlog

- Authentication: role-based access control (customer vs. store manager)
- Real payment gateway: card processing currently auto-succeeds

See [docs/backlog.md](docs/backlog.md) for the full list.
