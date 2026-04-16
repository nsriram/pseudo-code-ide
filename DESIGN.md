# Design

This document describes the UI layout, component responsibilities, visual design, and compiler architecture of the Pseudocode IDE.

---

## UI Layout

The application is divided into two vertical sections:

```
┌──────────────────────────────────────────────────────┐
│  TOP  (28vh, max 280px)                              │
│  QuestionPanel                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │ [badge] Title              [New Question]      │  │  ← sticky title bar
│  ├────────────────────────────────────────────────┤  │
│  │ Context paragraph (scrollable)                 │  │
│  │                                                │  │
│  │ ▌ Task: specific ask text here                │  │  ← highlighted ask
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  BOTTOM  (flex: 1, remaining height)                 │
│  ┌─────────────────────────┬──────────────────────┐  │
│  │  PseudocodeEditor       │  ErrorPanel          │  │
│  │  (flex: 1)              │  (320px)             │  │
│  │                         │                      │  │
│  │  [line gutter] textarea │  error list / OK msg │  │
│  │                         │                      │  │
│  │          [Compile]      │                      │  │
│  └─────────────────────────┴──────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Responsive breakpoints

| Breakpoint | Behaviour |
|---|---|
| ≥ 1025px (desktop) | Default layout as above. Error pane 320px wide. |
| ≤ 1024px (tablet landscape) | Error pane narrows to 260px. Top section allows up to 300px. |
| ≤ 768px (tablet portrait) | Bottom section stacks vertically. Error pane becomes a 200px strip below the editor. Compile button goes full-width. |

---

## Components

### `App.tsx`
Root component. Holds three pieces of state:
- `code` — the current editor contents
- `errors` — the list of `CompileError[]` (or `null` before first compile)
- `evalResults` — the `TestResult[]` from the evaluator (or `null` if not yet run)

On Compile: calls `compile(code)`, sets `errors`, then — if the compile is clean and the question has test cases — immediately calls `evaluate(program, testCases)` and sets `evalResults`. Passes `errorLines` (a `Set<number>`) down to the editor for gutter highlighting.

### `QuestionPanel`
**Location:** `src/features/questions/`

Displays the current question. Structure:
- **Title bar** (sticky): difficulty badge, question title, New Question button
- **Body** (scrollable): context paragraph and highlighted ask block

Uses the `useQuestion` hook which picks a random question from `questions.json`, excluding the current one on each "New Question" click.

### `PseudocodeEditor`
**Location:** `src/features/editor/`

A plain `<textarea>` with a synchronised line-number gutter. Error lines are highlighted in the gutter with a red left border. No autocomplete or syntax highlighting — intentional to replicate exam conditions.

The Compile button sits in a sticky toolbar at the bottom of the editor pane.

### `ErrorPanel`
**Location:** `src/features/errors/`

Displays the output of the compiler. Shows a green "No errors found" message on success, or a list of error cards on failure. Each card shows:
- Line and column reference
- Source tag: **Syntax** (lexer), **Structure** (parser), **Semantic** (validator)
- Error message

Wrapped in an `aria-live="polite"` region so screen readers announce results automatically after compilation.

### `EvaluationPanel`
**Location:** `src/features/evaluation/`

Rendered below `ErrorPanel` whenever `evalResults` is non-null (i.e., after a clean compile on a question that has test cases). Shows:
- A summary badge: **X/Y passed** (green if all pass, red otherwise)
- One row per test case with a tick (✓) or cross (✗) icon, the test label, and input/output detail
- For failing tests: `Expected: "…", Got: "…"` — so students can see exactly what went wrong

---

## Colour Scheme

The UI uses the [Catppuccin Mocha](https://github.com/catppuccin/catppuccin) palette.

| Role | Hex | Usage |
|---|---|---|
| Background | `#181825` | App background, editor |
| Surface | `#1e1e2e` | Panels, toolbar |
| Border | `#313244` | Dividers |
| Text primary | `#cdd6f4` | Main text |
| Text secondary | `#a6adc8` | Context text, labels |
| Text muted | `#585b70` | Line numbers, source tags |
| Accent (purple) | `#cba6f7` | Badges, ask highlight, New Question button, caret |
| Success (green) | `#a6e3a1` | Compile button, success message |
| Error (red) | `#f38ba8` | Error cards, error gutter, error count badge |

---

## CSS Architecture

Each component owns a co-located CSS Module file (e.g. `QuestionPanel.module.css`). There are no global utility classes. The only global rules are in `App.module.css` under `:root` and `*`.

```
src/
├── App.module.css              # Root layout, global reset, breakpoints
├── features/
│   ├── questions/
│   │   └── QuestionPanel.module.css
│   ├── editor/
│   │   └── PseudocodeEditor.module.css
│   ├── errors/
│   │   └── ErrorPanel.module.css
│   └── evaluation/
│       └── EvaluationPanel.module.css
```

---

## Compiler Architecture

The compiler runs entirely in the browser with no network calls. It is a five-phase pipeline in `src/features/compiler/`. For a detailed theory-level explanation of every phase see [COMPILER_DESIGN.md](COMPILER_DESIGN.md).

```
Source text
    │
    ▼
┌─────────┐   tokens + lex errors
│  Lexer  │ ──────────────────────────────────────────────┐
└─────────┘                                               │
    │ tokens                                              │
    ▼                                                     │
┌──────────┐   AST + parse errors                         │
│  Parser  │ ──────────────────────────────────────────┐  │
└──────────┘                                           │  │
    │ AST (if no errors so far)                        │  │
    ▼                                                  │  │
┌───────────┐   semantic errors                        │  │
│ Validator │ ───────────────────────────────────────┐ │  │
└───────────┘                                        │ │  │
    │ AST (if no errors)                             ▼ ▼  ▼
    ▼                                         CompileResult
┌─────────────┐                               { errors[] }
│ Interpreter │  interpret(program, inputs[])
└─────────────┘  → { output, error }
    │
    ▼
┌───────────┐
│ Evaluator │  evaluate(program, testCases[])
└───────────┘  → TestResult[]
```

### Lexer (`lexer.ts`)
Tokenises the source text character by character. Produces a flat array of typed tokens with line and column information. Handles Cambridge-specific symbols: `←` / `<-` (assignment), `–` (typographic dash as minus), `//` (comments), single-quoted char literals, `^` (power), string literals, all keywords, and operators. Keywords are matched case-insensitively — this is the single point where identifier casing is normalised.

### AST (`ast.ts`)
Typed AST node definitions. Every node carries `line` and `column` from its originating token. No runtime logic — pure TypeScript interfaces and discriminated unions.

### Parser (`parser.ts`)
Recursive-descent parser that converts the token stream into a `Program` AST. Implements all Cambridge AS pseudocode constructs: `DECLARE`, `CONSTANT`, `IF/THEN/ELSE`, `CASE/OF` (with multi-statement clause bodies), `FOR/TO/STEP` (including negative step), `WHILE/DO`, `REPEAT/UNTIL`, `PROCEDURE`, `FUNCTION`, `CALL`, `RETURN` (bare or with value), `INPUT`, `OUTPUT`, `OPENFILE`, `READFILE`, `WRITEFILE`, `CLOSEFILE`, array indexing, record field access, and all expression operators with correct precedence and right-associativity for `^`.

### Validator (`validator.ts`)
Walks the AST and performs semantic checks using a `Scope` class (linked symbol table with parent chain, case-insensitive):
- Undeclared variable/array/record references
- Constant reassignment
- `RETURN` rules: bare `RETURN` OK in procedures, valued `RETURN` only in functions
- Duplicate declarations in the same scope
- Wrong argument count for user-defined and built-in functions
- Unknown type names; record field existence against declared `TYPE`

### Interpreter (`interpreter.ts`) + Runtime (`runtime.ts`)
Tree-walking interpreter. `evalExpr()` evaluates expressions recursively; `executeStatement()` executes statements. The `Environment` class implements lexical (static) scoping with a parent-chain for closures. `RETURN` uses a `ReturnSignal` exception for non-local exit. A step counter in `Runtime` limits execution to 100,000 steps to prevent infinite loops from hanging the browser.

### Evaluator (`evaluate.ts`)
Runs the program against each test case's inputs and matches the output using a three-tier strategy: normalised exact match → case-insensitive substring (non-numeric only) → 1% numeric tolerance. Returns a `TestResult[]` with pass/fail for each case.

### Compiler index (`index.ts`)
Exposes the unified `compile(source: string): CompileResult` function and the `CompileError` type. Validation is skipped if any lexer or parser errors exist (to avoid cascading false positives from an incomplete AST).

---

## Question Data Model

```typescript
interface Question {
  id: string                    // 'q001' – 'q050'
  difficulty: 'simple' | 'intermediate' | 'complex'
  title: string                 // short display title
  context: string               // multi-paragraph scenario (pre-wrap)
  ask: string                   // the specific task to solve (pre-wrap)
  testCases?: TestCase[]        // optional auto-evaluation inputs/expected outputs
}

interface TestCase {
  inputs: string[]              // values consumed by INPUT statements in order
  expected: string              // expected program output (matched with tolerance)
  label?: string                // human-readable label, e.g. "3 + 5 = 8"
}
```

All 50 questions include `testCases`. Questions are stored as static JSON (`src/features/questions/questions.json`) and generated by `scripts/generate-questions.ts`. The `useQuestion` hook selects a random question at startup and on each "New Question" click, excluding the previously shown question.