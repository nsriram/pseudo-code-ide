# Technical Backlog — Pseudo-Code IDE

> Architect review conducted on 2026-04-15.  
> Issues are grouped by theme and ordered **High → Medium → Low** within each group.

---

## Table of Contents
1. [Compiler — Correctness](#1-compiler--correctness)
2. [Compiler — Missing Features](#2-compiler--missing-features)
3. [Runtime & Evaluation](#3-runtime--evaluation)
4. [Validator](#4-validator)
5. [Architecture & Type Safety](#5-architecture--type-safety)
6. [UI / Layout](#6-ui--layout)
7. [Accessibility & UX](#7-accessibility--ux)
8. [Testing](#8-testing)
9. [Code Quality](#9-code-quality)

---

## 1. Compiler — Correctness

### BUG-001 · CASE clause only allows a single statement per branch
**Priority:** High  
**File:** `src/features/compiler/parser.ts:363`

**Problem:**  
`parseCase()` calls `parseStatement()` once per clause and wraps the result in a single-element array. Cambridge pseudocode allows multiple statements inside a CASE branch. The following valid pseudocode silently drops the second statement:

```
CASE OF grade
  'A': OUTPUT "Excellent"
        total ← total + 1   // ← never executed
ENDCASE
```

**Solution:**  
Replace the single `parseStatement()` call per clause with `parseBlock(stopTokens)` where stop tokens include the next expression (start of next clause), `OTHERWISE`, and `ENDCASE`. This requires a lookahead heuristic or a sentinel approach consistent with how `parseBlock` works for other constructs.

---

### BUG-002 · Output matching produces false positives via substring rule
**Priority:** High  
**File:** `src/features/compiler/evaluate.ts:47`

**Problem:**  
The current strategy checks `normActual.includes(normExpected)` before numeric matching. This means:
- Expected `"10"` matches actual `"100"` or `"The sum is 100"`.
- Expected `"1"` matches any output containing the digit `1`.

Students writing incorrect code can pass tests accidentally.

**Solution:**  
Tighten rule 2 so that a bare number in `expected` only matches via the numeric tolerance path (rule 3), not the substring path. Substring matching should only apply when `expected` is clearly a phrase (contains non-numeric characters). A practical fix:

```ts
// Only apply substring rule when expected is not a pure number
const isPureNumber = !isNaN(Number(normExpected)) && normExpected !== ''
if (!isPureNumber && normActual.toLowerCase().includes(normExpected.toLowerCase())) return true
```

---

### BUG-003 · `RecordAccess` kind check is semantically wrong
**Priority:** High  
**File:** `src/features/compiler/interpreter.ts:47`

**Problem:**  
Records are stored internally as `PseudoArray` (both use `kind: 'array'`). The guard on line 47 reads:
```ts
if (rec === null || … || (rec as { kind: string }).kind !== 'array') {
  throw new RuntimeError(`'${expr.record}' is not a record`)
}
```
This means if you accidentally pass a plain `PseudoArray` (e.g., a 1-D array), the error is swallowed and field access silently returns `0`. There is no way to distinguish at runtime whether a value is a record vs. an array.

**Solution:**  
Introduce a separate `PseudoRecord` type with `kind: 'record'` in `runtime.ts`. Set `kind: 'record'` in `DeclareStatement` when the data type is a `NamedType`. Check `kind === 'record'` in `RecordAccess` and `kind === 'array'` in `ArrayAccess`.

---

### BUG-004 · FOR loop with STEP 0 causes infinite loop
**Priority:** Medium  
**File:** `src/features/compiler/interpreter.ts:265–280`

**Problem:**  
`FOR i ← 1 TO 10 STEP 0` will spin forever because neither the `step > 0` nor the `step <= 0` branch ever terminates. The step-limit guard will eventually fire (at 100 k ticks), but this gives a misleading "infinite loop" error when the root cause is STEP 0.

**Solution:**  
Add an explicit guard before the loop:
```ts
if (step === 0) throw new RuntimeError('FOR loop STEP value cannot be zero')
```

---

### BUG-005 · FOR…NEXT variable name match is case-sensitive
**Priority:** Low  
**File:** `src/features/compiler/parser.ts:383`

**Problem:**  
```ts
if (check('IDENTIFIER') && peek().value === varTok.value) advance()
```
Cambridge pseudocode keywords are case-insensitive. If a student writes `FOR Count ← 1 TO 5 … NEXT count`, the NEXT identifier is not consumed and the parser may misparse the following statement.

**Solution:**  
Compare case-insensitively:
```ts
if (check('IDENTIFIER') && peek().value.toUpperCase() === varTok.value.toUpperCase()) advance()
```

---

## 2. Compiler — Missing Features

### FEAT-001 · Lexer has no comment support
**Priority:** High  
**File:** `src/features/compiler/lexer.ts`

**Problem:**  
Cambridge pseudocode uses `//` for single-line comments. The lexer emits `DIVIDE DIVIDE` for `//`, which then causes parse errors. Students who add comments (a good practice) immediately see spurious errors.

**Solution:**  
In the lexer's main loop, detect `//` and skip to end of line:
```ts
if (peek() === '/' && peek(1) === '/') {
  while (pos < source.length && peek() !== '\n') advance()
  continue
}
```

---

### FEAT-002 · Built-in functions missing from validator allowlist
**Priority:** Medium  
**File:** `src/features/compiler/validator.ts:105`

**Problem:**  
The validator's built-in allowlist is:
```ts
const builtins = new Set(['LENGTH', 'LEFT', 'RIGHT', 'MID', 'ASC', 'EOF'])
```
But the interpreter supports: `CHR`, `INT`, `ROUND`, `UCASE`, `LCASE`, `NUM_TO_STR`, `STR_TO_NUM`, `IS_NUM`. Calling any of these produces a spurious validator error: `"Function 'UCASE' is not defined"`, even though execution would succeed.

**Solution:**  
Extend the Set to match all built-ins implemented in `interpreter.ts`:
```ts
const builtins = new Set([
  'LENGTH', 'LEFT', 'RIGHT', 'MID', 'ASC', 'CHR',
  'INT', 'ROUND', 'UCASE', 'LCASE',
  'NUM_TO_STR', 'STR_TO_NUM', 'IS_NUM', 'EOF',
])
```

---

### FEAT-003 · No support for `BYREF` / `BYVAL` parameter passing
**Priority:** Medium  
**File:** `src/features/compiler/parser.ts:438-444`, `interpreter.ts:143`

**Problem:**  
Cambridge AS-level pseudocode specifies `BYREF` and `BYVAL` parameter modes. Currently all parameters are passed by value. Procedures that modify their arguments (a common pattern) silently fail — values in the caller are unchanged.

**Solution:**  
1. Extend `Parameter` in `ast.ts` with `passMode: 'BYVAL' | 'BYREF'` (default `BYVAL`).
2. Update `parseParams()` to consume optional `BYREF`/`BYVAL` before each parameter name.
3. In `interpreter.ts`, for `BYREF` params, pass the environment + variable name rather than the value, and write back on procedure return.

---

### FEAT-004 · No CHAR literal support
**Priority:** Low  
**File:** `src/features/compiler/lexer.ts`

**Problem:**  
Cambridge pseudocode uses single quotes for CHAR literals: `'A'`. The lexer has no single-quote handling. Writing `DECLARE c : CHAR` then `c ← 'A'` causes an `UNKNOWN` token error.

**Solution:**  
Add a single-quote branch in the lexer that reads exactly one character and emits a `STRING_LITERAL` (or new `CHAR_LITERAL`) token.

---

### FEAT-005 · `^` (power) operator is missing from lexer
**Priority:** Low  
**File:** `src/features/compiler/lexer.ts`, `interpreter.ts:83`

**Problem:**  
The interpreter handles `^` (`Math.pow`), but `^` is not in the `singleChar` map in the lexer. Writing `x ^ 2` produces `UNKNOWN` token for `^`.

**Solution:**  
Add `'^': 'POWER'` to the `singleChar` map and add `POWER` to `TokenType`. In `parseMulDiv`, add `check('POWER')` (or handle at a new higher-precedence `parsePower` level, since right-associativity is conventional for exponentiation).

---

## 3. Runtime & Evaluation

### RT-001 · Callables and values share the same Environment map
**Priority:** Medium  
**File:** `src/features/compiler/runtime.ts`, `interpreter.ts:29-32, 311, 324`

**Problem:**  
`PseudoCallable` is stored in `Environment` via a double cast (`callable as unknown as PseudoValue`). Every identifier lookup must then test for `kind === 'callable'` to guard against accidentally using a function as a value. This is fragile and produces hard-to-read runtime errors when the guard fires.

**Solution:**  
Add a second `Map` to `Environment` specifically for callables:
```ts
private readonly callables = new Map<string, PseudoCallable>()
defineCallable(name: string, c: PseudoCallable): void
getCallable(name: string): PseudoCallable | null
```
Remove all `as unknown as PseudoValue` casts and the guard in `Identifier` evaluation.

---

### RT-002 · `Environment.set()` silently creates undeclared variables
**Priority:** Medium  
**File:** `src/features/compiler/runtime.ts:64-65`

**Problem:**  
If a variable is not found anywhere in the scope chain, `set()` defines it in the current scope rather than throwing. The comment says "handles loop variables and implicit declarations" but the validator already ensures all variables are declared. This safety valve means runtime type errors (e.g., a typo in a variable name) silently create a new variable at runtime instead of failing.

**Solution:**  
Remove the implicit-creation fallback. FOR loop variable is explicitly `define`d before the loop body in `interpreter.ts:267`, so it does not need the fallback. If a `set()` reaches the end without finding the key, throw `RuntimeError`.

---

### RT-003 · Array key collision in multi-dimensional access
**Priority:** Low  
**File:** `src/features/compiler/interpreter.ts:41, 204`

**Problem:**  
Array indices are joined with comma as string keys: `[1, 2]` → key `"1,2"`. An edge case exists: a 1-D array accessed as `arr["1,2"]` (if strings were valid indices) would collide with `arr[1,2]`. While Cambridge pseudocode uses integer indices, the runtime does not enforce this.

**Solution:**  
Use a separator that cannot appear in a valid index, such as `\x00`, or use a nested `Map<string, Map<string, ...>>` for multi-dimensional arrays.

---

### RT-004 · `pseudoToString` emits `[array]` for arrays — not useful
**Priority:** Low  
**File:** `src/features/compiler/interpreter.ts:362`

**Problem:**  
`OUTPUT myArray` emits `[array]`. This is uninformative for students debugging their code. Cambridge pseudocode typically doesn't output arrays directly, but showing `[array]` gives no hint about contents.

**Solution:**  
Render the array contents: iterate `data.entries()`, sort by key, format as `[v1, v2, v3]`. For records, use `{field: value}` format.

---

## 4. Validator

### VAL-001 · RETURN allowed in PROCEDURE (should be forbidden with a value)
**Priority:** Medium  
**File:** `src/features/compiler/validator.ts:279-284`

**Problem:**  
The validator uses `insideFunction: boolean` to decide whether `RETURN` is legal. However, Cambridge pseudocode distinguishes:
- `RETURN <expr>` — only valid inside FUNCTION
- A bare `RETURN` (no value) — valid inside PROCEDURE to exit early

Currently a bare `RETURN` in a PROCEDURE causes a parse error (parser always expects an expression after RETURN), and a valued RETURN inside a procedure is flagged correctly. But the flag message says `"RETURN can only be used inside a FUNCTION"` which is misleading — bare RETURN is fine in a procedure.

**Solution:**  
1. Update parser to optionally parse the expression after RETURN (using lookahead).
2. Update validator to track `insideProcedure` alongside `insideFunction` and differentiate the error message.

---

### VAL-002 · Scope uses case-sensitive name comparison, runtime uses uppercase
**Priority:** Medium  
**File:** `src/features/compiler/validator.ts:34-46`, `runtime.ts:41,45,53`

**Problem:**  
`Scope.define()` and `Scope.lookup()` use `sym.name` as-is. `Environment.define()` normalises to `.toUpperCase()`. This means:
- `DECLARE myVar : INTEGER` → registered in Scope as `"myVar"`, in Environment as `"MYVAR"`.
- `OUTPUT MyVar` → Scope lookup for `"MyVar"` fails (case mismatch), producing a validator error, even though the runtime would succeed.

In practice Cambridge pseudocode is case-insensitive for identifiers, but this divergence means the validator rejects valid mixed-case code.

**Solution:**  
Normalise names in `Scope` to `.toUpperCase()` (or `.toLowerCase()`) consistently, mirroring `Environment`.

---

### VAL-003 · Record field existence not validated at compile time
**Priority:** Medium  
**File:** `src/features/compiler/validator.ts:87-94`

**Problem:**  
`RecordAccess` validation (line 87–94) only checks that the record variable is declared; it does not check that the accessed field exists in the TYPE definition. `book.nonExistentField` compiles without error, silently returns `0` at runtime.

**Solution:**  
Store field names in the `Symbol` for type declarations:
```ts
interface Symbol { …; fields?: string[] }
```
In `checkExpr` for `RecordAccess`, look up the variable's `dataType`, resolve it to a `TypeDecl`, and verify `expr.field` is a known field.

---

### VAL-004 · Function argument count not validated for built-ins
**Priority:** Low  
**File:** `src/features/compiler/validator.ts:103-113`

**Problem:**  
User-defined function argument counts are validated (line 109), but built-ins are passed through with no arity check. `LENGTH()` with 0 arguments, or `MID(s)` with 1 argument instead of 3, produce runtime errors rather than compile-time errors.

**Solution:**  
Define an arity map for built-ins:
```ts
const BUILTIN_ARITY: Record<string, number | [number, number]> = {
  LENGTH: 1, LEFT: 2, RIGHT: 2, MID: 3,
  ASC: 1, CHR: 1, INT: 1, ROUND: [1, 2], // [min, max]
  UCASE: 1, LCASE: 1, NUM_TO_STR: 1, STR_TO_NUM: 1, IS_NUM: 1,
}
```
Check `expr.args.length` against this map.

---

## 5. Architecture & Type Safety

### ARCH-001 · `CompileResult` is not a discriminated union
**Priority:** Medium  
**File:** `src/features/compiler/index.ts:15-18`

**Problem:**  
```ts
interface CompileResult {
  errors: CompileError[]
  program: import('./ast').Program | null
}
```
Callers must check both `errors.length === 0` and `program !== null` separately. The shape is ambiguous: can `program` be non-null when `errors` is non-empty? (It currently cannot, but the type does not enforce this.)

**Solution:**  
Use a discriminated union:
```ts
type CompileResult =
  | { ok: true;  program: Program; errors: [] }
  | { ok: false; program: null;    errors: CompileError[] }
```
This allows callers to pattern-match on `result.ok` with full type narrowing.

---

### ARCH-002 · `BinaryExpr.operator` is untyped `string`
**Priority:** Low  
**File:** `src/features/compiler/ast.ts:31`

**Problem:**  
`operator: string` on `BinaryExpr` and `UnaryExpr` loses all type safety. The interpreter's switch cases over operator strings cannot be exhaustiveness-checked by TypeScript.

**Solution:**  
Define a union type:
```ts
type BinaryOperator = '+' | '-' | '*' | '/' | 'DIV' | 'MOD' | '^'
  | '=' | '<>' | '<' | '>' | '<=' | '>='
  | 'AND' | 'OR' | '&'
type UnaryOperator = '-' | 'NOT'
```
Update `BinaryExpr.operator` and `UnaryExpr.operator` accordingly. The compiler `switch` in `interpreter.ts:67` will then flag any unhandled case at compile time.

---

### ARCH-003 · `useQuestion` selects questions with uniform probability regardless of difficulty
**Priority:** Low  
**File:** `src/features/questions/useQuestion.ts`

**Problem:**  
`nextQuestion()` picks uniformly at random from all 50 questions. A student could get a recursive algorithm question on their first attempt. There is no notion of difficulty progression.

**Solution:**  
Add a `difficulty: 'easy' | 'medium' | 'hard'` field to the `Question` interface and `questions.json`. Initially seed new sessions with only easy questions and graduate difficulty as the student passes tests. Alternatively, expose a difficulty filter in the UI.

---

## 6. UI / Layout

### UI-001 · No mobile layout — editor and output panel stack too narrow
**Priority:** High  
**File:** `src/App.module.css:50-58`

**Problem:**  
At viewport widths below ~768px the `.bottom` flex row has an editor pane and an output pane side-by-side. The output pane drops to 220px width, leaving the editor pane barely usable. On phones the layout is completely broken.

**Solution:**  
Add a breakpoint that stacks the panes vertically on mobile:
```css
@media (max-width: 600px) {
  .bottom { flex-direction: column; }
  .errorPane { width: 100%; border-left: none; border-top: 1px solid #313244; height: 40vh; }
}
```

---

### UI-002 · Question content area clips long questions silently
**Priority:** Medium  
**File:** `src/App.module.css:31`

**Problem:**  
`.questionContent` has `overflow: hidden`. Several questions in `questions.json` have long context paragraphs (e.g., q014, q034). The text is cut off without a scroll affordance, so students cannot read the full question.

**Solution:**  
Change to `overflow-y: auto` so the area scrolls when content overflows, while still capping at `max-height: 220px`.

---

### UI-003 · Line numbers in gutter desync from textarea scroll
**Priority:** Medium  
**File:** `src/features/editor/PseudocodeEditor.tsx:17-26`

**Problem:**  
The gutter (`div.gutter`) and the `textarea` are positioned side-by-side, but their scroll positions are independent. When the user scrolls a long program, the gutter numbers stay fixed while the code scrolls, causing misalignment after ~20 lines.

**Solution:**  
Synchronise scroll: listen to `onScroll` on the textarea and apply `scrollTop` to the gutter div via a `ref`:
```ts
const gutterRef = useRef<HTMLDivElement>(null)
<textarea onScroll={(e) => { if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop }} />
```

---

### UI-004 · `Run Tests` button is redundant after auto-evaluation
**Priority:** Low  
**File:** `src/features/editor/PseudocodeEditor.tsx:42-46`, `src/App.tsx:26-29`

**Problem:**  
Tests now run automatically on every clean compile. The `Run Tests` button still appears but clicking it reruns identical tests with no change in state. This confuses students ("Did I need to click this?").

**Solution:**  
Remove the `onRunTests` prop and the `Run Tests` button entirely. Auto-evaluation on compile is sufficient. If manual re-evaluation is needed in future (e.g., after changing test inputs), it can be reintroduced with a clearer label like "Re-run Tests".

---

## 7. Accessibility & UX

### A11Y-001 · Compile button has no keyboard shortcut
**Priority:** Medium  
**File:** `src/features/editor/PseudocodeEditor.tsx:38-41`

**Problem:**  
Industry-standard shortcut for "run/compile" in an IDE is **Ctrl+Enter** (or **Cmd+Enter** on Mac). Students accustomed to other coding environments will expect this. Requiring a mouse click to compile interrupts keyboard-centric workflows.

**Solution:**  
Add a `keydown` handler to the textarea:
```ts
onKeyDown={(e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    onCompile()
  }
}}
```

---

### A11Y-002 · Buttons lack `aria-label` attributes
**Priority:** Medium  
**File:** `src/features/editor/PseudocodeEditor.tsx:39,43`

**Problem:**  
Screen readers will read "Compile" and "Run Tests" from text content, which is acceptable, but the buttons have no `type="button"` attribute. Inside a `<form>` (not present now, but a future refactor risk) they would default to `type="submit"`. Adding explicit `type` is a defensive best practice.

**Solution:**  
```tsx
<button type="button" className={styles.compileButton} onClick={onCompile}>Compile</button>
```

---

### A11Y-003 · No focus management after compile
**Priority:** Low  
**File:** `src/App.tsx:21-30`

**Problem:**  
After clicking Compile, focus stays on the button. If there are errors, the student has to manually tab to the error panel to read the details. Screen-reader users receive no announcement of the result.

**Solution:**  
Use an ARIA live region on the error panel so results are announced automatically:
```tsx
<div aria-live="polite" aria-atomic="true">
  <ErrorPanel … />
</div>
```

---

### UX-001 · Error panel shows `Col 1` for all validator errors
**Priority:** Low  
**File:** `src/features/compiler/validator.ts:53-55`

**Problem:**  
Validator errors always report `column: stmt.column`. For most statement nodes, the column points to the keyword (e.g., column 1 for `DECLARE`), not the actual offending token. This means all validator errors highlight the wrong column in the gutter.

**Solution:**  
Pass the column of the offending identifier/token to `error()` rather than defaulting to the statement's start column. For example, an "already declared" error should point at the duplicate name's column, not the `DECLARE` keyword.

---

## 8. Testing

### TEST-001 · No tests for `//` comment handling (once FEAT-001 is implemented)
**Priority:** High (blocker on FEAT-001)  
**File:** `src/features/compiler/lexer.test.ts`

**Problem:**  
Once comment support is added, the lexer tests must cover:
- Comment-only line
- Comment after a statement
- `//` inside a string literal (should not be treated as comment)

---

### TEST-002 · `evaluate.test.ts` has no false-positive tests
**Priority:** High  
**File:** `src/features/compiler/evaluate.test.ts`

**Problem:**  
All current evaluate tests verify that correct code passes. There are no tests that verify incorrect-but-compiling code **fails** the evaluation. BUG-002 (substring false positives) cannot be caught by the test suite without these.

**Solution:**  
Add tests like:
```ts
it('does not pass when output contains expected as a substring of a larger number', () => {
  // program outputs "100", expected "10" — should FAIL
  expect(results[0].passed).toBe(false)
})
```

---

### TEST-003 · CASE multi-statement body not tested
**Priority:** Medium  
**File:** `src/features/compiler/interpreter.test.ts`

**Problem:**  
There is no interpreter test for a CASE clause with multiple statements. Once BUG-001 is fixed, a regression test is needed.

---

### TEST-004 · No test for `BYREF` parameter mutation (once FEAT-003 is implemented)
**Priority:** Medium  

**Problem:**  
Once BYREF is implemented, tests must verify that changes to a BYREF parameter inside a procedure are visible at the call site after return.

---

### TEST-005 · Validator case-sensitivity divergence (VAL-002) has no test
**Priority:** Medium  
**File:** `src/features/compiler/validator.test.ts`

**Problem:**  
There is no test for `DECLARE myVar : INTEGER` followed by `OUTPUT MyVar` (mixed case). Once VAL-002 is fixed, a regression test should be added.

---

### TEST-006 · No end-to-end tests
**Priority:** Low  

**Problem:**  
No Playwright or Cypress test suite exists. Unit tests cover the compiler pipeline well, but there are no tests for:
- Full user flow: load → write code → compile → see results
- New Question button resetting all state
- Layout at different viewport sizes

**Solution:**  
Add Playwright tests for at minimum the happy path and the "New Question resets state" flow. The existing `src/App.test.tsx` (RTL) partially covers this but doesn't test the visual layout.

---

## 9. Code Quality

### QA-001 · Parser uses comma-operator for array bounds parsing
**Priority:** Low  
**File:** `src/features/compiler/parser.ts:240`

**Problem:**  
```ts
bounds.push({ lower: parseExpression(), upper: (expect('COLON'), parseExpression()) })
```
The comma expression `(expect('COLON'), parseExpression())` is clever but surprising to readers. It relies on JavaScript's comma operator semantics. If `expect()` somehow returned a value that short-circuits, the intent is unclear.

**Solution:**  
Rewrite as explicit statements:
```ts
const lower = parseExpression()
expect('COLON', 'Expected ":" in array bounds')
const upper = parseExpression()
bounds.push({ lower, upper })
```

---

### QA-002 · `validator.ts` uses `as` casts on already-narrowed switch cases
**Priority:** Low  
**File:** `src/features/compiler/validator.ts:165, 176, 185, 199, 210, 219`

**Problem:**  
```ts
case 'IfStatement': {
  const s = stmt as IfStatement   // cast not needed — stmt is already narrowed
```
TypeScript's switch-case narrows the discriminated union type automatically. The `as` casts are both redundant and suppress potential future type errors.

**Solution:**  
Remove all `as XxxStatement` casts inside `checkStatement`'s switch cases. The same pattern was already fixed in `interpreter.ts` — apply the same fix here.

---

### QA-003 · `EvaluationPanel` uses array index as React key
**Priority:** Low  
**File:** `src/features/evaluation/EvaluationPanel.tsx:41`

**Problem:**  
```tsx
{results.map((r, i) => <ResultRow key={i} result={r} index={i} />)}
```
Using array index as `key` causes React to reuse DOM nodes incorrectly when the results array changes length between renders (e.g., New Question with fewer test cases than the previous).

**Solution:**  
Use a stable key. The `label` or a combination of `inputs.join(':')` is sufficient:
```tsx
key={r.label ?? r.inputs.join(':')}
```

---

### QA-004 · `compile()` runs validator only when parse errors are zero, but lexer errors are not gated
**Priority:** Low  
**File:** `src/features/compiler/index.ts:49`

**Problem:**  
```ts
if (parseErrors.length === 0) { validate(program) }
```
Lexer errors (e.g., unknown character `@`) are collected but the parse still runs. If the lexer errors produce malformed tokens that cause parse errors, both sets are accumulated. However if the lexer errors do NOT cause parse errors (e.g., a comment character like `//`), validation runs on a potentially incorrect AST.

**Solution:**  
Gate validation on `errors.length === 0` (covering both lexer and parse errors) rather than only `parseErrors.length === 0`. This is a one-line change and aligns with the intent stated in the adjacent comment.

---

*Last updated: 2026-04-15*