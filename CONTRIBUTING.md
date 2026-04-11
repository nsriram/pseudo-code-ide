# Contributing

Thank you for your interest in contributing to the Pseudocode IDE. This guide covers everything you need to get started.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm 10 or later
- [Docker](https://www.docker.com/) + [Colima](https://github.com/abiosoft/colima) (macOS) for Docker builds
- [Playwright](https://playwright.dev/) browsers for e2e tests (installed via `npx playwright install`)

---

## Getting Started

```bash
git clone https://github.com/nsriram/pseudo-code-ide.git
cd pseudo-code-ide
npm install
npm run dev
```

---

## Development Workflow

This project follows a plan-first workflow for all non-trivial changes:

1. **Understand the requirement** — read [DESIGN.md](DESIGN.md) and the pseudocode compilation rules in `.claude/compilation_rules.md`
2. **Open or pick an issue** — check the issue tracker; create one if none exists
3. **Plan before coding** — write down the files you will change and why before starting
4. **Implement** — follow the code conventions below
5. **Write unit tests** — every new function or component needs tests in a co-located `*.test.ts(x)` file
6. **Update e2e tests** — if the change affects visible UI behaviour, update `e2e/`
7. **Commit** — use the commit message format below

---

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<short-description>` | `feature/add-array-sorting-question` |
| Bug fix | `fix/<short-description>` | `fix/parser-case-clause-body` |
| Chore | `chore/<short-description>` | `chore/update-dependencies` |
| Docs | `docs/<short-description>` | `docs/update-readme` |

---

## Commit Message Format

```
<type>: <short summary>

<optional body — what and why, not how>

Co-Authored-By: Your Name <email>
```

**Types:** `feat`, `fix`, `chore`, `docs`, `test`, `ci`, `refactor`

Examples:

```
feat: add binary search question to question bank
fix: parser incorrectly consuming CASE clause bodies
docs: add DESIGN.md with compiler architecture
```

---

## Code Conventions

- **TypeScript strict mode** — no `any`, no implicit returns
- **CSS Modules** — one `.module.css` file per component; no global utility classes
- **No autocomplete in the editor** — do not add `spellCheck`, `autoComplete`, or suggestion libraries to `PseudocodeEditor`
- **Feature-based folder structure** — new features go in `src/features/<feature-name>/`
- **Co-located tests** — test files sit next to the code they test (e.g. `lexer.ts` → `lexer.test.ts`)

---

## Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage report
npm run test:coverage

# End-to-end tests (requires a running dev server)
npm run dev &
npm run test:e2e
```

The CI pipeline requires all tests to pass before merging to `main`.

---

## Adding Questions

See the [Adding or Updating Questions](README.md#adding-or-updating-questions) section of the README.

Questions should follow Cambridge AS Level style:
- A multi-sentence `context` with a real-world scenario
- A named module or procedure spec where appropriate
- A specific `ask` that references the context

---

## Submitting a Pull Request

1. Push your branch to GitHub
2. Open a PR against `main`
3. Ensure all CI checks pass (lint, build, test, Docker)
4. Fill in the PR description with what changed and why
5. Request a review

The `main` branch is protected — direct pushes are not allowed.

---

## Reporting Issues

Please open a GitHub issue with:
- A clear title
- Steps to reproduce (for bugs)
- Expected vs actual behaviour
- Browser and OS version if it is a UI issue