# Pseudocode IDE

[![CI](https://github.com/nsriram/pseudo-code-ide/actions/workflows/ci.yml/badge.svg)](https://github.com/nsriram/pseudo-code-ide/actions/workflows/ci.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://pseudo-code-ide.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A browser-based IDE for Cambridge AS Level Computer Science students to practise writing pseudocode for examination questions.

**[Try it live →](https://pseudo-code-ide.onrender.com)**

---

## Features

- **Exam-style question bank** — 50 questions across three difficulty levels (simple, intermediate, complex), modelled on real Cambridge AS exam papers with rich scenario context
- **Pseudocode editor** — plain text editor with line numbers and error gutter highlighting; no autocomplete so students practise unaided
- **Compiler pipeline** — full lexer → parser → semantic validator running entirely in the browser; no backend required
- **Error panel** — structured error output with line/column references and source tags (Syntax, Structure, Semantic)
- **Responsive layout** — works on desktop and tablet (iPad portrait and landscape)

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- npm 10 or later

### Setup

```bash
git clone https://github.com/nsriram/pseudo-code-ide.git
cd pseudo-code-ide
npm install
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other scripts

| Command | Description |
|---|---|
| `npm run build` | Production build (output in `dist/`) |
| `npm run lint` | ESLint with security plugins |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run generate:questions` | Regenerate `questions.json` from the script |

---

## Running with Docker

```bash
# Build
docker build -t pseudo-code-ide .

# Run (visit http://localhost:10000)
docker run -p 10000:10000 pseudo-code-ide
```

---

## Adding or Updating Questions

Questions are defined in [`scripts/generate-questions.ts`](scripts/generate-questions.ts) and compiled into [`src/features/questions/questions.json`](src/features/questions/questions.json).

**To add or edit questions:**

1. Open `scripts/generate-questions.ts`
2. Add or modify entries in the `questions` array — each entry follows this shape:

```typescript
{
  id: 'q051',                        // unique, sequential (q001–q050 are taken)
  difficulty: 'simple',              // 'simple' | 'intermediate' | 'complex'
  title: 'Short descriptive title',
  context: 'Multi-paragraph scenario describing the problem...',
  ask: 'The specific task the student must solve.',
}
```

3. Regenerate the JSON:

```bash
npm run generate:questions
```

4. Validate with the schema tests:

```bash
npm test -- scripts/generate-questions.test.ts
```

---

## Project Structure

```
pseudo-code-ide/
├── src/
│   ├── features/
│   │   ├── compiler/        # Lexer, parser, AST, validator, compiler index
│   │   ├── editor/          # PseudocodeEditor component
│   │   ├── errors/          # ErrorPanel component
│   │   └── questions/       # QuestionPanel, useQuestion hook, questions.json
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── generate-questions.ts   # Question bank generator
├── e2e/                         # Playwright end-to-end tests
├── sample_questions/            # Reference Cambridge exam questions
├── .claude/                     # Claude Code config and pseudocode compilation rules
├── Dockerfile
├── nginx.conf
└── render.yaml
```

---

## Deployment

The app is deployed on [Render](https://render.com) as a Docker web service.

- **CI/CD**: GitHub Actions runs lint → build → test on every push and PR. On merge to `main`, the Docker image is built and pushed to `ghcr.io`.
- **Hosting**: Render pulls the Docker image and serves it via nginx on the free tier.
- **Config**: `render.yaml` defines the service; `nginx.conf` handles SPA routing and cache headers.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Design

See [DESIGN.md](DESIGN.md) for UI layout, component design, and compiler architecture.

## License

[MIT](LICENSE)