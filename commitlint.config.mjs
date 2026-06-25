export default {
  extends: ['@commitlint/config-conventional'],
  // Align with docs/agents/commit-messages.md: the subject caps near 200, and
  // body wrapping is a soft guide (around 72), not a hard failure.
  rules: {
    'header-max-length': [2, 'always', 200],
    'body-max-line-length': [0, 'always', 100],
  },
};
