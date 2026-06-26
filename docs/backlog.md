# Backlog

Work that sits outside the seven product features. These are cross-cutting concerns and infrastructure, deferred so the feature work can land first. Simplifications made within a feature (for example FIFO scheduling or always-successful payment) are tracked in [assumptions.md](assumptions.md), not here.

## Deferred

| Item | Description | Impact when added |
|------|-------------|-------------------|
| **Database integration** | ~~Replace the in-memory repositories with a real database.~~ Done: `PrismaOrderRepository` and `PrismaMenuRepository` implement the existing ports and are selected via `DATABASE_URL`. Kitchen state remains in-memory (single-process scope). Deferred from this iteration: Prisma migrations workflow beyond `db push`, a shared `PrismaClient` singleton across modules, and deriving order readiness from live slot state instead of the stored estimate (would close the accepted residual in the concurrency audit). | Nothing further required to swap repositories; the deferred items above are independent. |
| **Authentication** | Identify who is calling the API. | Adds an auth mechanism (for example JWT) at the edge. No domain changes. |
| **Authorization (roles)** | Separate customer and store manager permissions. The two actors exist in the requirements but are not enforced yet. | Guards on manager-only endpoints (menu writes, kitchen monitoring). Controller layer only. |
| **Real payment simulation** | Replace the always-successful confirmation with cash and credit card handling, amount validation, failure paths, and refunds. | Payment becomes a real step in the order lifecycle. The confirmation contract stays the same, so the kitchen queue entry is unaffected. |
