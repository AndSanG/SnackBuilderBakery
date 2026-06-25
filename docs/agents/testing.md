# Testing

How tests are written in this project. Like the other guides, this is language and framework agnostic: it describes the approach and conventions, not the specifics of any test runner. It expands on the testing notes in the development process guide, which governs when tests are written; this guide governs how. For the concrete tooling and code patterns used here (Jest, spec layout, the spy and factory helpers), see the project's [testing setup](../testing.md).

## What a test verifies

A test verifies one observable behavior through a public interface. It does not reach into private internals, and it does not assert on how a result was computed, only that the right result or effect was produced. Tests that know too much about implementation break on every refactor and stop being useful.

Test the contract, not the mechanism. For a use case, that means its defined inputs, results, and failure outcomes (see the contracts document). For an entity, that means its rules.

## Structure of a test

Each test reads as three parts, in order (the xUnit phases call these setup, exercise, and verify):

1. **Arrange.** Build the system under test (SUT) and its collaborators in the state the case requires.
2. **Act.** Exercise one behavior, usually a single call.
3. **Assert.** Check one outcome.

Keep the SUT obvious. A small factory helper that constructs the SUT with its collaborators (and returns both) keeps each test focused on what is unique to that case, and keeps construction in one place so it changes once when the constructor changes.

## One behavior per test

Each test checks exactly one behavior. If a test needs to assert two different behaviors, split it into two tests. A failing test should point to a single cause. This keeps failures diagnostic and keeps the suite readable as a specification of behavior.

## Naming

Name a test as a sentence fragment describing the behavior: the subject, the condition, and the expected outcome. No runner-specific prefix is required. Patterns that read well:

- `subject_expectedOutcome`
- `subject_condition_expectedOutcome`

For example: "delivers no items on an empty repository", "fails with a not found error when the order is unknown".

## Verification: state and behavior

There are two ways a test confirms the exercised code did the right thing:

- **State verification.** Examine the state of the SUT and its collaborators after the action and assert it is correct.
- **Behavior verification.** Check that the SUT made the expected calls on its collaborators.

Most tests use state verification. Behavior verification is the right tool when the effect is a call rather than a returned value (for example, that a confirmed order was enqueued), or when state cannot reveal the outcome (a cache hit and a cache miss look identical from the outside).

## Test doubles

A test double is any stand-in for a real collaborator. Following Meszaros, there are five kinds, from simplest to most involved:

- **Dummy.** Passed only to fill a parameter list; never actually used.
- **Fake.** A working but simplified implementation, fine for tests but not for production (an in-memory store standing in for a database).
- **Stub.** Returns canned answers to the calls made during the test, and nothing more.
- **Spy.** A stub that also records how it was called (which methods, how many times, with what arguments), so the test can assert on those interactions.
- **Mock.** Pre-programmed with expectations that form a specification of the calls it must receive, and which verifies those calls itself. Only mocks insist on behavior verification.

This project hand-rolls its doubles rather than using a mock framework, and favors **spies**: a spy returns a configured result when the test reads data, and records its calls when the test checks an interaction, so one double serves both verification styles and the test (not the double) makes the assertions. We do not use auto-verifying mocks with pre-set expectations. Reach for a fake only when a real collaboration boundary is worth exercising.

## Classical, not mockist

There are two schools of test-driven development. The mockist style replaces every collaborator with a framework mock and verifies behavior by asserting on expected calls. The classical style uses real objects or simple fakes wherever practical, doubles only the awkward collaborators, and verifies by state where it can.

This project is **classical**. We prefer real objects and small hand-rolled doubles over a mock framework, default to state verification, and use behavior verification only where the call is the outcome. The reason is the coupling trade-off below: mockist tests tie themselves to how a method calls its collaborators, which makes them break under refactoring that does not change behavior. Classical tests, focused on results, stay green through such refactors and keep the freedom to change implementation.

### A caveat on behavior verification

Asserting on calls couples a test to how the code is implemented, not only to what it produces, so such a test can break under a refactor that does not change behavior. Prefer state verification when the outcome is observable as a returned value or a state change. Use behavior verification when the call itself is the outcome. This keeps tests resilient while still proving the interactions that matter.

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
