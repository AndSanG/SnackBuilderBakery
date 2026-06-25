# Backlog

Work that sits outside the seven product features. These are cross-cutting concerns and infrastructure, deferred so the feature work can land first. Simplifications made within a feature (for example FIFO scheduling or always-successful payment) are tracked in [assumptions.md](assumptions.md), not here.

## Deferred

| Item | Description | Impact when added |
|------|-------------|-------------------|
| **Database integration** | Replace the in-memory repositories with a real database (likely Prisma + PostgreSQL). | Only the infrastructure layer changes. Domain and application code stay the same because they depend on repository interfaces. |
| **Authentication** | Identify who is calling the API. | Adds an auth mechanism (for example JWT) at the edge. No domain changes. |
| **Authorization (roles)** | Separate customer and store manager permissions. The two actors exist in the requirements but are not enforced yet. | Guards on manager-only endpoints (menu writes, kitchen monitoring). Controller layer only. |
| **Real payment simulation** | Replace the always-successful confirmation with cash and credit card handling, amount validation, failure paths, and refunds. | Payment becomes a real step in the order lifecycle. The confirmation contract stays the same, so the kitchen queue entry is unaffected. |
