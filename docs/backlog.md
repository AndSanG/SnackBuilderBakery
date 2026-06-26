# Backlog

Work that sits outside the seven product features. These are cross-cutting concerns and infrastructure, deferred so the feature work can land first. Simplifications made within a feature (for example FIFO scheduling or always-successful payment) are tracked in [assumptions.md](assumptions.md), not here.

## Deferred

| Item | Description | Impact when added |
|------|-------------|-------------------|
| **Database integration** | ~~Replace the in-memory repositories with a real database.~~ ~~Done: `PrismaOrderRepository` and `PrismaMenuRepository` implement the existing ports and are selected via `DATABASE_URL`. Kitchen state remains in-memory (single-process scope).~~ Fully complete: a shared `PrismaModule` provides a single `PrismaClient` singleton; an initial Prisma migration replaces `db push`; `ReconcileOrders` derives readiness from the kitchen's live slot state, closing the accepted residual in the concurrency audit. | Complete. |
| **Authentication** | Identify who is calling the API. | Adds an auth mechanism (for example JWT) at the edge. No domain changes. |
| **Authorization (roles)** | Separate customer and store manager permissions. The two actors exist in the requirements but are not enforced yet. | Guards on manager-only endpoints (menu writes, kitchen monitoring). Controller layer only. |
| **Real payment simulation** | Replace the always-successful confirmation with cash and credit card handling, amount validation, failure paths, and refunds. | Payment becomes a real step in the order lifecycle. The confirmation contract stays the same, so the kitchen queue entry is unaffected. |
| **Doc inconsistencies** | Several docs drifted from the implementation: (1) `docs/domain-model.md` omits `PaymentProcessing` from `OrderStatus`, lists `bakeDuration` as a stored field on `OrderItem` (it is derived from `Category`), and names a `BakingItem` field `orderItem` when the code uses `item: BakeableItem`. (2) `docs/module-map.md` and `docs/contracts.md` describe `ReconcileKitchen` and `EstimateOrderReadyTime` as kitchen-layer use cases — neither exists; reconciliation lives in `ReconcileOrders` (orders module) and estimation is an internal `Kitchen` method. (3) `AGENTS.md` still says persistence is in-memory and the database is in the backlog, but database integration is complete. | Readers of the docs have an inaccurate mental model of the order lifecycle, the kitchen architecture, and the current persistence layer. |
