# AGENTS.md

Guidance for any AI agent working in this repository, whether Claude Code or another tool. Read this before writing code or documentation.

## Start here

These three guides are the rules of the road, not background reading:

- [docs/agents/development-process.md](docs/agents/development-process.md): how we build. The TDD loop, the phases, and commit discipline.
- [docs/agents/clean-architecture.md](docs/agents/clean-architecture.md): how the code is structured. The dependency rule, the layers, and ports.
- [docs/agents/testing.md](docs/agents/testing.md): how tests are written. What a test verifies, test doubles, isolation, and naming.

See [docs/agents/README.md](docs/agents/README.md) for a one-line description of each guide and how they fit together.

Follow them. If a change would violate either, stop and reconsider the change.

## Non-negotiables

- **Test-driven.** No production code without a failing test first. Red, green, refactor, commit.
- **Clean architecture.** Dependencies point inward. Domain code has no framework or infrastructure imports. Cross boundaries through ports defined by the consumer and sized to its needs.
- **One implementation per abstraction.** Introduce an interface, strategy, or extra layer when its second implementation actually arrives. Until then keep the seam (one well-named method or boundary) and defer the abstraction.
- **Commit one use case at a time.** Develop test by test, but commit a complete, tested behavior. Every commit builds and runs. See the development process guide for the exception (complex use cases may be split finer), and [docs/agents/commit-messages.md](docs/agents/commit-messages.md) for how to write the message.

## Project specifics live in docs/

- [challenge.md](docs/challenge.md): the original brief.
- [functional-requirements.md](docs/functional-requirements.md): use cases as stories and acceptance criteria, with happy and sad courses.
- [domain-model.md](docs/domain-model.md): entities versus DTOs.
- [module-map.md](docs/module-map.md): modules, ports, and dependency diagrams.
- [contracts.md](docs/contracts.md): ports and use case contracts.
- [testing.md](docs/testing.md): this project's concrete test tooling and patterns (Jest, spec layout, spy and factory helpers).
- [architecture-decisions.md](docs/architecture-decisions.md): stack and cross-cutting decisions.
- [assumptions.md](docs/assumptions.md): interpretations of ambiguous requirements.
- [backlog.md](docs/backlog.md): work deferred outside the current scope.
- [testing-strategy.md](docs/testing-strategy.md): coverage map per use case (automated and manual layers).
- [docker-usage.md](docs/docker-usage.md): running the full stack with Docker Compose, including Prometheus.
- [decisions/concurrency-audit.md](docs/decisions/concurrency-audit.md): every shared-state mutation path and how each race is handled.
- [decisions/scheduling-data-structures.md](docs/decisions/scheduling-data-structures.md): benchmarked alternatives to the kitchen's data structures and the triggers that would justify switching.

## Conventions

- Do not use em dashes in any project file. Use a colon or rewrite the sentence.
- American English.
- Name design documents for their content, not for a phase.
- Source lives under `src/`, one folder per feature module, layered by clean architecture.

## Stack

NestJS and TypeScript, tested with Jest. Persistence is backed by PostgreSQL via Prisma when `DATABASE_URL` is set; both `PrismaMenuRepository` and `PrismaOrderRepository` implement the existing ports. When `DATABASE_URL` is absent the modules fall back to in-memory implementations, which is the default for unit tests. The current time is provided by a `Clock` port so it can be controlled in tests.
