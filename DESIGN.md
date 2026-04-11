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
Root component. Holds the `code` and `errors` state. Calls `compile()` on the Compile button click and passes `errorLines` (a `Set<number>`) down to the editor.

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
│   └── errors/
│       └── ErrorPanel.module.css
```

---

## Compiler Architecture

The compiler runs entirely in the browser with no network calls. It is implemented as a three-stage pipeline in `src/features/compiler/`.

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
    │ AST (if no parse errors)                         │  │
    ▼                                                  │  │
┌───────────┐   semantic errors                        │  │
│ Validator │ ───────────────────────────────────────┐ │  │
└───────────┘                                        │ │  │
                                                     ▼ ▼  ▼
                                              CompileResult
                                              { errors[] }
```

### Lexer (`lexer.ts`)
Tokenises the source text character by character. Produces a flat array of typed tokens with line and column information. Handles Cambridge-specific symbols: `←` (assignment), `–` (typographic dash as minus), string/char literals, all keywords, and operators.

### AST (`ast.ts`)
Typed AST node definitions. No runtime logic — pure TypeScript interfaces and type unions.

### Parser (`parser.ts`)
Recursive descent parser that converts the token stream into a `Program` AST. Implements all Cambridge AS pseudocode constructs: `DECLARE`, `CONSTANT`, `IF/THEN/ELSE`, `CASE/OF`, `FOR/TO/STEP`, `WHILE/DO`, `REPEAT/UNTIL`, `PROCEDURE`, `FUNCTION`, `CALL`, `RETURN`, `INPUT`, `OUTPUT`, `OPENFILE`, `READFILE`, `WRITEFILE`, `CLOSEFILE`, array indexing, and all expression operators.

### Validator (`validator.ts`)
Walks the AST and performs semantic checks using a `Scope` class (symbol table with parent chain):
- Undeclared variable references
- Constant reassignment
- `RETURN` outside a `FUNCTION`
- Duplicate declarations in the same scope
- Wrong number of arguments to procedures and functions

### Compiler index (`index.ts`)
Exposes the unified `compile(source: string): CompileResult` function and the `CompileError` type. Validation is skipped if the parser produced errors (to avoid cascading false positives).

---

## Question Data Model

```typescript
interface Question {
  id: string           // 'q001' – 'q050'
  difficulty: 'simple' | 'intermediate' | 'complex'
  title: string        // short display title
  context: string      // multi-paragraph scenario (pre-wrap)
  ask: string          // the specific task to solve (pre-wrap)
}
```

Questions are stored as static JSON (`src/features/questions/questions.json`) and generated by `scripts/generate-questions.ts`. The `useQuestion` hook selects a random question at startup and on each "New Question" click, excluding the previously shown question.