# Testing in this project

The concrete realization of the generic [testing guide](agents/testing.md) for this codebase: NestJS and TypeScript, tested with Jest. Read the generic guide for the principles (what a test verifies, doubles, isolation); this document covers the tooling and the patterns used here.

## Tooling

- **Jest** with **ts-jest** runs the suite directly against the TypeScript sources.
- **@nestjs/testing** is available for wiring a module when an integration-style test needs the container. Plain use case and entity tests do not need it: they construct the subject directly and inject fakes.

## Where tests live

Specs are colocated with the code they exercise, named `*.spec.ts` in the same folder as the unit. For example the `ViewMenu` use case and its spec sit together:

```
src/menu/application/view-menu.ts
src/menu/application/view-menu.spec.ts
```

Specs are excluded from the production build through `tsconfig.build.json` (which ignores `**/*.spec.ts`), so test code never ships in `dist/`.

## Running the suite

```bash
npm test           # run all specs in random order
npm run test:cov   # run with a coverage report
```

Each run prints a seed. To reproduce a specific order, pass it back:

```bash
npx jest --seed=<printed-seed>
```

## Jest configuration

Configured in the `jest` section of `package.json`:

- `testRegex: .*\.spec\.ts$` discovers the colocated specs.
- `transform` runs sources through `ts-jest`.
- `randomize: true` shuffles test order to surface hidden coupling.
- `collectCoverageFrom` excludes `*.module.ts` and `main.ts` (wiring, not behavior).
- `passWithNoTests: true` keeps the suite green before any test exists.

## Patterns used here

### A factory for the subject

Each spec has a small `makeSUT` helper that builds the subject under test with its collaborators and returns both. Construction lives in one place, and each test states only what is unique to it.

### A spy for the port

The collaborator is a spy that implements the port, captures how it was called, and exposes a setter for the cases that read data. From the `ViewMenu` spec:

```ts
class MenuRepositorySpy implements MenuRepository {
  getAllCallCount = 0;
  private result: MenuItem[] = [];

  async getAll(): Promise<MenuItem[]> {
    this.getAllCallCount += 1;
    return this.result;
  }

  stubGetAll(items: MenuItem[]): void {
    this.result = items;
  }
}

const makeSUT = () => {
  const repository = new MenuRepositorySpy();
  const sut = new ViewMenu(repository);
  return { sut, repository };
};
```

Interaction tests assert on the captured calls (`getAllCallCount`); data tests configure a result with `stubGetAll` and assert on what the use case delivers.

### Describe and name

Group with `describe(<subject>)` and write each case as a behavior sentence in `it(...)`:

```ts
describe('ViewMenu', () => {
  it('does not message the repository upon creation', () => { /* ... */ });
  it('delivers all items from the repository', async () => { /* ... */ });
});
```

### Async

Use `async/await`. Await the action, then assert on the resolved value. Do not assert inside a floating promise.

## Time in tests

The current time comes from a `Clock` port. Tests inject a fake clock they can advance, so scheduling and estimation behavior is verified instantly without real waiting. The fake clock and its helpers live in the shared module alongside the `Clock` port.
