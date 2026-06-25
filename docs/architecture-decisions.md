# Architecture Decisions — Snack Builder Bakery

## Stack

| Concern | Decision | Rationale |
|---|---|---|
| **Runtime** | Node.js | — |
| **Language** | TypeScript | Type safety, IDE support |
| **Framework** | NestJS | Decorator-based DI maps to feature-slice thinking; strong module system |
| **Testing** | Jest + `@nestjs/testing` | NestJS default; first-class support for providers and mocking |
| **DTO validation** | `class-validator` + `class-transformer` | NestJS standard; declarative, pipe-compatible |
| **Entity IDs** | UUID (string) | No sequential ID leakage; safe for distributed use |
| **API docs** | `@nestjs/swagger` | Auto-generates OpenAPI spec from decorators |
| **Containerization** | Docker Compose | Easy environment setup and observability |

## Persistence

In-memory repositories behind interfaces for the initial deliverable.

All persistence operations go through repository interfaces defined in the domain layer. The in-memory implementations live in the infrastructure layer and can be replaced with a real database driver (e.g., Prisma + PostgreSQL) without touching domain or application code.

## Time Simulation

The scheduler is **poll-based, not timer-based**. Bake completion is determined by comparing `clock.now()` against stored `startedAt` timestamps — no `setTimeout` or background processes. State is recalculated on every query.

A `Clock` interface is injected as a NestJS provider wherever the current time is needed. Tests inject a `FakeClock` with an `advance(minutes)` method to simulate time passing without real waits or third-party libraries.

## Backlog (out of scope for this deliverable)

1. **Database integration** — swap in-memory repositories for Prisma + PostgreSQL. Only the infrastructure layer changes.
2. **Authentication** — role-based access control (customer vs. store manager). Only the controller/guard layer is affected; domain logic is unchanged.

## Principles

- **Domain Isolation** — domain models have no framework imports (`class-validator` decorators live on DTOs, not domain entities).
- **Dependency Inversion** — application services depend on repository and clock interfaces, not concrete implementations.
- **No Global State** — all shared state goes through injected providers.
- **Concurrency Safety** — the kitchen scheduler is the sole owner of oven state; no shared mutable state outside it.
