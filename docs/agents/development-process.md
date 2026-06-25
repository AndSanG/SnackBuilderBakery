# Development Process

The process this project follows, from planning to test-driven delivery. It is written to be language and framework agnostic: it names no specific build tool, test framework, or web framework, so the same steps apply regardless of stack.

This is adapted from a generic TDD and Clean Architecture runbook (originally written around an iOS / Swift project) which is kept as the reference source. This version records only what has actually been done here, through Phase 2, and drops anything not yet reached or not relevant to a backend API with no UI.

## Core principles

1. **Domain isolation.** Domain models carry business rules and have no dependency on infrastructure (database, HTTP, serialization) or on the web framework. Validation decorators and transport shapes live on DTOs, not on domain types.
2. **Dependency inversion.** High-level code depends on abstractions (ports), not concrete implementations. Collaborators are injected through constructors.
3. **Test-driven.** Behavior is tested through public interfaces, never private internals. Tests use spies that capture interactions rather than stubs that preset return values, except where a read genuinely needs a configured result.
4. **No global state.** Third-party singletons and ambient values (the current time, random sources) are hidden behind ports and injected. The current time is provided by a `Clock` port so it can be controlled in tests.
5. **Concurrency is a first-class concern.** Shared mutable state has a single owner. Thread or task safety is designed in, not bolted on.
6. **One implementation per abstraction.** An interface, strategy, or extra layer is introduced when its second implementation or its first real variation arrives, not in anticipation. The design is pruned to remove abstractions that have exactly one implementation today.

## The TDD loop

Every unit of behavior is built in this cycle:

1. **Red.** Write one failing test. Add the minimum stub needed for it to compile, then run it and confirm it fails for the expected reason.
2. **Green.** Write the minimum production code to make the test pass. Run it and confirm it passes.
3. **Refactor.** Clean up without changing behavior. Remove duplication, clarify names, improve structure. Run the tests again and confirm they still pass.
4. **Commit.** Commit one use case at a time: a complete, tested, working behavior. This is the default unit, because it is the smallest change that is independently meaningful and it keeps history readable. Develop test by test, but do not commit per test. Split into finer commits only when a use case is complex enough that its intermediate steps tell a story worth keeping (for example, the priority scheduler). Either way, every commit builds and runs.

Hard rules:

- No production code without a failing test first.
- No commit without a passing test, and every commit must build (tests may be red during development, but the build is never broken).
- Ports grow one operation at a time, as the use case under test requires them. Do not define a whole interface up front.

## Phase 0: Plan

Goal: describe the whole system in terms of use cases, models, modules, and contracts, without naming a framework.

1. **Gather requirements.** Read the brief or, if none exists, collect the core use cases, primary entities, and non-functional constraints.
2. **Resolve cross-cutting decisions** before designing: persistence approach, authentication, time simulation, containerization, and the testing approach. Record them, along with anything deferred, so the design can account for them.
3. **Write use cases in BDD style.** Express each feature as a user story (narrative) with acceptance criteria (Given / When / Then), then list the use cases each feature exercises, with a primary course (happy path) and the error courses (sad paths).
4. **Separate domain models from DTOs.** Identify the pure domain entities and the transport objects that cross the API boundary, and the mapping between them.
5. **Decide module boundaries and dependency directions.** Keep dependencies pointing inward. When one module needs another, the consumer defines a single port for exactly what it needs, and the provider supplies an adapter. The boundary exists to keep the consumer testable, not as inversion for its own sake.
6. **Define contracts.** Write the ports and use case contracts as operations with inputs, outputs, and outcomes, in plain language.
7. **Draw the dependency diagrams.** A cross-module view and an inside-a-module view.
8. **Record assumptions and a backlog.** Capture every interpretation of an ambiguous requirement, and the work deliberately left out of the current iteration.

Iteration note: it is valid to scope the first pass as a proof of concept that establishes the structure end to end through one vertical slice, deferring later features. State this explicitly.

Design audit: before leaving Phase 0, review the design and cut abstractions that have a single implementation today. Keep the seam (one well-named method or one boundary), defer the abstraction.

Exit criteria: the system can be fully described in terms of modules and contracts without naming any specific framework.

## Phase 1: Project Foundation

Goal: an empty project that builds and runs its test suite before any logic exists.

1. Initialize the project with its build configuration and dependency manifest.
2. Configure the test runner with coverage enabled and random test order.
3. Add an ignore file for build output, dependencies, and coverage.
4. Create the application entry point and root composition, plus empty module skeletons for the first feature only. No logic.

Exit criteria: the project builds cleanly and the test suite runs green with zero tests, coverage on, random order.

## Phase 2: Drive features with tests

Goal: implement features one at a time, each use case driven by the TDD loop.

Work one feature, then one use case, then one test at a time. For each use case:

- Start from the use case contract defined in Phase 0.
- Drive the application service with a spy implementation of its port. The spy captures how it was called; configure a return only when the behavior under test reads data.
- Add each port operation the moment a test needs it, not before.
- Keep mapping between transport shapes and domain models out of the domain.

Order within a typical read or command use case:

1. The service does not message its port on creation.
2. Executing the service calls the expected port operation exactly once.
3. The service delivers the empty or default result correctly.
4. The service delivers the populated result correctly.
5. The service surfaces the port's error as the defined failure outcome.

Adapt the list to the use case. Omit steps that do not apply to the language: for example, a deallocation or memory-leak test is unnecessary in a garbage-collected runtime.

## Cross-cutting conventions

- **Test naming.** Describe the behavior as a sentence fragment: subject, condition, expected outcome. No framework-specific prefix is required.
- **One behavior per test.** If a test needs two assertions about different behaviors, split it into two tests.
- **Spies over stubs.** Capture interactions. Configure return values only when the read under test requires them.
- **Access control.** Keep the public surface minimal. Ports are public; implementations are internal where the language allows.
- **Result and error handling.** Use the language's idiomatic success and failure types consistently. Avoid bespoke success or failure enums where a standard one fits.
- **Progressive documentation.** Write each README section at the moment the thing it describes exists. The "how to install, compile, run, and test" section is due as soon as the project builds and the test suite runs. Keep any stated test counts in sync with the suite.
- **Commit discipline.** The default commit unit is one use case (see the TDD loop). Stage files explicitly by name. Confirm the build and the intended test state before committing. The git log should read as a narrative of behavior.

## Artifact naming

Name design documents for their content, not for the phase that produced them. Prefer names like requirements, domain model, module map, and contracts over plan, setup, or phase numbers.
