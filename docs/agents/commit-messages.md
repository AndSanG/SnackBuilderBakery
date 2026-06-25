# Commit Messages

Good practices for writing commit messages here. For when to commit and at what granularity (one use case at a time), see [development-process.md](development-process.md). This guide is about the message itself.

## Subject line

- Use the form `type(scope): summary`, for example `feat(menu): add ViewMenu use case`.
- Types: `feat` (a behavior), `fix` (a bug), `refactor` (no behavior change), `test`, `docs`, `chore` (tooling, deps, scaffolding).
- Scope is the feature or area, for example `menu`, `kitchen`, or omitted for repo-wide changes.
- Write the summary in the imperative mood: "add", "fix", "move", not "added" or "adds".
- Keep it short (aim for 150 characters, hard cap around 200). No trailing period.
- The summary names the behavior, not the files touched.

## Body

- Separate the body from the subject with one blank line.
- Explain what changed and why, not how. The diff already shows how.
- Record the reasoning that is not obvious from the code: a decision, a trade-off, a deferred concern.
- Wrap lines at around 72 characters.
- The body is optional for small, self-evident changes. A one-line subject is fine when it says everything.

## What a good message reads like

```
feat(menu): add AddMenuItem use case

Generate the id with randomUUID, persist via the new add operation on
MenuRepository, and return the created item. Validation stays on the DTO,
so the use case has no sad path.
```

## Avoid

- File dumps as a message ("update files", "changes to menu").
- Past tense or present-continuous ("added", "adding").
- Restating the diff line by line instead of the intent.
- Em dashes. Use a colon or rewrite the sentence (a repo-wide convention).
- Bundling unrelated changes. One commit is one coherent unit of behavior.

## The log as a narrative

Read end to end, the commit history should tell the story of the system's behavior growing, one tested use case at a time. If the log reads as a pile of file edits rather than a sequence of behaviors, the commits are too coarse, too fine, or poorly described.
