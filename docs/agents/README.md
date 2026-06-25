# Agent Guides

The guides in this folder define how work is done in this repository. They are aimed at any AI agent contributing here, but they apply to human contributors just as well. The repository entry point [AGENTS.md](../../AGENTS.md) points here; read that first.

## What each guide does

- [development-process.md](development-process.md): how we build. The test-driven loop (red, green, refactor, commit), the phases from planning to delivery, and commit discipline. Read this to know what to do next and in what order.
- [clean-architecture.md](clean-architecture.md): how the code is structured. The dependency rule, the layers, ports and adapters, and what data may cross a boundary. Read this to know where a piece of code belongs and what it may depend on.
- [testing.md](testing.md): how tests are written. What a test verifies, test doubles, isolation and determinism, naming, and what not to test. Read this to know how to write a test that proves behavior.
- [commit-messages.md](commit-messages.md): how commit messages are written. Subject form, body, and what to avoid. Read this before committing.

The three are complementary: the process guide governs the rhythm of change, the architecture guide governs the shape of the result, and the testing guide governs how each change is proven. A change should satisfy all three.

## How to use them

1. Read [AGENTS.md](../../AGENTS.md) for the non-negotiables and the map of project documents.
2. Read both guides here before writing code.
3. For project specifics (requirements, contracts, module map, decisions), see the documents in the parent [docs/](../) folder.

These guides are intentionally generic and free of project specifics, so they stay valid as the codebase grows. Where a guide needs a concrete example, it points to the project documents rather than embedding details that would drift.
