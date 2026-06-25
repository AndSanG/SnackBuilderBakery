# Testing

How tests are written in this project. Like the other guides, this is language and framework agnostic: it describes the approach and conventions, not the specifics of any test runner. It expands on the testing notes in the development process guide, which governs when tests are written; this guide governs how. For the concrete tooling and code patterns used here (Jest, spec layout, the spy and factory helpers), see the project's [testing setup](../testing.md).

## What a test verifies

A test verifies one observable behavior through a public interface. It does not reach into private internals, and it does not assert on how a result was computed, only that the right result or effect was produced. Tests that know too much about implementation break on every refactor and stop being useful.

Test the contract, not the mechanism. For a use case, that means its defined inputs, results, and failure outcomes (see the contracts document). For an entity, that means its rules.

## Structure of a test

Each test reads as three parts, in order:

1. **Arrange.** Build the subject under test and its collaborators in the state the case requires.
2. **Act.** Exercise one behavior, usually a single call.
3. **Assert.** Check one outcome.

Keep the subject under test obvious. A small factory helper that constructs the subject with its collaborators (and returns both) keeps each test focused on what is unique to that case, and keeps construction in one place so it changes once when the constructor changes.

## One behavior per test

Each test checks exactly one behavior. If a test needs to assert two different behaviors, split it into two tests. A failing test should point to a single cause. This keeps failures diagnostic and keeps the suite readable as a specification of behavior.

## Naming

Name a test as a sentence fragment describing the behavior: the subject, the condition, and the expected outcome. No runner-specific prefix is required. Patterns that read well:

- `subject_expectedOutcome`
- `subject_condition_expectedOutcome`

For example: "delivers no items on an empty repository", "fails with a not found error when the order is unknown".

## Test doubles

Prefer doubles that capture interactions over doubles that pre-program answers.

- **Spy.** Records how it was called (which methods, how many times, with what arguments). This is the default. Assertions are made against what the spy captured.
- **Stub.** Returns a configured value. Use a stub only when the behavior under test reads data and therefore needs a result to read. Even then, prefer a spy that also exposes a way to set the result, so a single double serves both roles.
- **Fake.** A working but simplified implementation of a port (for example an in-memory store). Useful for integration-style tests across a real collaborator boundary.
- **Dummy.** A placeholder passed only to satisfy a signature, never used.

Avoid presetting return values when the test is really about an interaction. Capturing the interaction is what proves the behavior.

## Isolation and determinism

- Unit tests touch no database, no network, no web server, and no real clock. Collaborators are replaced by small fakes or spies through their ports.
- Time is controlled. The current time comes from a clock port, and tests inject a fake clock they can advance, so behavior that depends on elapsed time is verified instantly and deterministically, with no real waiting.
- Tests are independent. No test depends on another's state or on execution order. The suite runs in random order to surface hidden coupling, so any ordering assumption is a defect to fix.
- Tests are fast. Speed comes for free once the suite avoids real infrastructure.

## Coverage

Coverage is measured to find untested behavior, not as a target to game. Use it to spot use cases and branches that no test exercises, then add the missing behavior as a test. A high percentage with weak assertions proves nothing.

## What not to test

- Do not test the framework or the language runtime. Assume they work.
- Do not test private methods directly. If a private detail feels like it needs its own test, it usually wants to be its own unit behind a port.
- Do not assert on incidental output (log lines, formatting) unless that output is the behavior under test.
- Skip checks that do not apply to the language. For example, a deallocation or memory-leak test is unnecessary in a garbage-collected runtime.

## Test placement

Tests live alongside the code they exercise, in a form the build excludes from production output. A test is a first-class artifact: it is written before the production code that satisfies it, and it is kept green.
