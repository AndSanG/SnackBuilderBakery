# Solution

## Core requirements

| Requirement | Where |
|---|---|
| Menu Management | `src/menu/` — `ViewMenu`, `AddMenuItem`, `UpdateMenuItem`, `RemoveMenuItem` use cases; `GET/POST/PATCH/DELETE /menu` |
| Order Placement + tracking | `src/orders/application/place-order.ts`, `track-order.ts`; ticket returns `orderId` and `totalPrice`; `GET /orders/:id` returns status |
| Payment Management | `src/orders/application/confirm-payment.ts` + `src/orders/infrastructure/local-payment-processor.ts`; accepts cash and card, validates amount, returns change |
| Bake time rules | `src/shared/domain/category.ts` — single source of truth (`Cookie 5`, `Pastry 10`, `Bread 20` min) |
| Capacity-based estimation | `src/kitchen/domain/kitchen.ts` `estimateReadyTime` — runs the scheduling algorithm forward on a copy of current state; called atomically inside `enqueueAndEstimate` |
| Kitchen Monitoring | `src/kitchen/application/monitor-kitchen.ts`; `GET /kitchen` returns two ovens of three trays plus the waiting queue |
| Priority queuing | `src/orders/domain/priority-tier.ts` maps source to tier; `src/kitchen/domain/scheduling-policy.ts` `PriorityPolicy` fills free slots highest-tier-first with no preemption; VIP ripple in `confirm-payment.ts` `refreshBumpedEstimates` updates estimates for all lower-priority in-kitchen orders |

## Technical expectations

**Design patterns.** The scheduler uses a Strategy (`SchedulingPolicy` / `PriorityPolicy` / `FifoPolicy`). All persistence and external concerns are behind Repository and Port/Adapter interfaces defined by the consumer. See [docs/module-map.md](docs/module-map.md).

**Concurrency.** Payment confirmation claims the order atomically (`claimForPayment`) before charging, preventing double-charges under concurrent requests. Every other shared-state path is audited in [docs/decisions/concurrency-audit.md](docs/decisions/concurrency-audit.md).

**Time simulation.** `Clock` port in `src/shared/clock/`; tests inject `FakeClock` and call `advance(minutes)`. The e2e suite bakes a cookie in 0 ms. See [walkthrough.md](walkthrough.md) section 6.

**Clean architecture.** Dependencies point inward: domain has zero framework imports, use cases depend only on ports, infrastructure is swappable (in-memory ↔ Prisma/PostgreSQL via `DATABASE_URL`). Full tour in [walkthrough.md](walkthrough.md).

**Automated testing.** 97 unit tests + 8 e2e tests, 93% coverage (`npm run test:e2e`, `npm run test:cov`). Coverage map in [docs/testing-strategy.md](docs/testing-strategy.md).

**Version control.** One commit per use case; commit log reads as a delivery narrative. Conventional commits enforced by a commitlint hook.

**Docker Compose.** `docker compose up -d` starts the API and Prometheus. Structured JSON logs on stdout; metrics at `/metrics` and `http://localhost:9090`. See [docs/docker-usage.md](docs/docker-usage.md).
