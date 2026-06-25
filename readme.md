# Snack Builder Bakery API

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

The first iteration is a proof of concept that establishes the full project structure through one vertical slice: Menu Management, Order Placement, an always-successful payment confirmation, a FIFO Kitchen Scheduler, and Capacity-Based Estimation (features 1 to 4). The goal is to lay down the architecture, module boundaries, and end-to-end flow that the remaining features build on. Priority Queuing, Kitchen Monitoring, and real Payment Management come next. See [assumptions.md](docs/assumptions.md) for the simplifications this implies.

## Getting Started

Built with NestJS and TypeScript. Tests run on Jest.

### Requirements

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
npm test           # run the test suite (random order)
npm run test:cov   # run with a coverage report
```

### Layout

```
src/        application code, one folder per feature module
docs/       design documents (requirements, contracts, decisions)
readme.md   this file
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

- Database integration (Prisma + PostgreSQL): currently using in-memory repositories
- Authentication: role-based access control (customer vs. store manager)
