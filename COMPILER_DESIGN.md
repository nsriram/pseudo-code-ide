# Compiler Design

## A Technical Reference for the Cambridge AS Pseudocode Compiler

---

## Table of Contents

1. [Overview and Architecture](#1-overview-and-architecture)
2. [Phase 1 — Lexical Analysis](#2-phase-1--lexical-analysis)
3. [Phase 2 — Syntax Analysis (Parsing)](#3-phase-2--syntax-analysis-parsing)
4. [Phase 3 — Semantic Analysis](#4-phase-3--semantic-analysis)
5. [Phase 4 — Interpretation (Execution)](#5-phase-4--interpretation-execution)
6. [Phase 5 — Evaluation](#6-phase-5--evaluation)
7. [Runtime Model](#7-runtime-model)
8. [Error Architecture](#8-error-architecture)
9. [The Type System](#9-the-type-system)
10. [Design Trade-offs and Constraints](#10-design-trade-offs-and-constraints)

---

## 1. Overview and Architecture

### 1.1 What Is Being Compiled

This compiler accepts **Cambridge International AS & A Level Computer Science pseudocode** — a structured, line-oriented language specified by Cambridge Assessment International Education. The language is not an industry standard but is precisely defined by the syllabus. Unlike a general-purpose language compiler, the target audience is students, so error messages must be educational rather than terse.

### 1.2 Compilation Strategy

The compiler is an **interpreter-based pipeline**: it translates source text into an Abstract Syntax Tree (AST) and then *tree-walks* that AST to execute the program directly. There is no intermediate representation (IR), no bytecode, and no code generation step. This is appropriate because:

- The programs are short (educational exercises)
- Execution speed is irrelevant at this scale
- Tree-walking keeps the codebase small and auditable in the browser

### 1.3 Pipeline Diagram

```
Source Text (string)
        │
        ▼
  ┌─────────────┐
  │   Lexer     │  tokenize()        src/features/compiler/lexer.ts
  │             │  → Token[]
  └─────────────┘  + LexerError[]
        │
        ▼
  ┌─────────────┐
  │   Parser    │  parse()           src/features/compiler/parser.ts
  │             │  → Program (AST)
  └─────────────┘  + ParseError[]
        │
        ▼
  ┌─────────────┐
  │  Validator  │  validate()        src/features/compiler/validator.ts
  │             │  → ValidationError[]
  └─────────────┘
        │
        ▼
  ┌─────────────┐
  │ Interpreter │  interpret()       src/features/compiler/interpreter.ts
  │             │  → { output, error }
  └─────────────┘
        │
        ▼
  ┌─────────────┐
  │  Evaluator  │  evaluate()        src/features/compiler/evaluate.ts
  │             │  → TestResult[]
  └─────────────┘
```

Each phase is a **pure function**: it takes its input and returns a result with no side effects on shared state. Phases communicate only through their return values.

### 1.4 Orchestration

The `compile()` function in `src/features/compiler/index.ts` sequences the pipeline and enforces a key invariant:

```
if (lexErrors.length > 0 || parseErrors.length > 0):
    skip validation              // AST may be structurally incomplete
```

This prevents the semantic analyser from seeing a half-formed tree and producing confusing or misleading errors. The interpreter is never called by `compile()` — that is the separate concern of the evaluator.

---

## 2. Phase 1 — Lexical Analysis

**File:** `src/features/compiler/lexer.ts`  
**Entry point:** `tokenize(source: string): LexerResult`

### 2.1 Responsibility

The lexer (also called a *scanner* or *tokeniser*) converts the raw source string into a flat sequence of **tokens** — the atoms of the language. It answers one question: *what are the meaningful units in this character stream?*

### 2.2 Token Types

The lexer recognises 80+ token types, grouped as:

| Category | Examples |
|---|---|
| Keywords | `INPUT`, `OUTPUT`, `IF`, `WHILE`, `FOR`, `PROCEDURE`, `FUNCTION` |
| Type keywords | `INTEGER`, `REAL`, `STRING`, `BOOLEAN`, `CHAR`, `DATE` |
| Operators (symbol) | `←`, `<-`, `=`, `<>`, `<=`, `>=`, `+`, `-`, `*`, `/`, `^`, `&` |
| Operators (word) | `DIV`, `MOD`, `AND`, `OR`, `NOT` |
| Literals | `INTEGER_LITERAL`, `REAL_LITERAL`, `STRING_LITERAL`, `BOOLEAN_LITERAL` |
| Punctuation | `(`, `)`, `[`, `]`, `:`, `,`, `.` |
| Structure | `NEWLINE`, `EOF` |
| Built-in functions | `LENGTH`, `LEFT`, `RIGHT`, `MID`, `ASC` |

### 2.3 Scanning Algorithm

The lexer is a **handwritten single-pass scanner** using two primitives:

- `peek(offset)` — inspect the character at `pos + offset` without consuming it
- `advance()` — consume and return the character at `pos`

It maintains three pieces of mutable state: `pos` (byte offset), `line`, and `lineStart` (offset of the current line's first character). Column numbers are derived as `pos - lineStart + 1`.

The main loop dispatches on the first character of each lexeme:

```
while pos < source.length:
    skip whitespace (space, tab)
    if '\n'   → emit NEWLINE, increment line counter
    if '"'    → scanStringLiteral()
    if "'"    → scanCharLiteral() — emits STRING_LITERAL
    if '←'   → emit ASSIGN
    if '<-'   → emit ASSIGN (ASCII fallback)
    if '//'   → skip to end of line (comment)
    if two-char operators (<>, <=, >=) → emit
    if single-char operators → emit
    if digit  → scanNumber()
    if letter or '_' → scanIdentifier()
    else      → emit UNKNOWN, record LexerError
```

### 2.4 Keyword Recognition

Keywords are recognised inside `scanIdentifier()` using a **lookup table** (`KEYWORDS: Record<string, TokenType>`). After accumulating word characters, the scanner upper-cases the word and looks it up:

```typescript
const upper = word.toUpperCase()
const kwType = KEYWORDS[upper]
tokens.push(makeToken(kwType ?? 'IDENTIFIER', word, ...))
```

This one-step normalisation is why `integer`, `Integer`, and `INTEGER` all produce the `INTEGER` token type. The case-insensitivity of the language is therefore resolved entirely at the lexer boundary — no other phase needs to handle it.

### 2.5 Number Scanning

Numbers are scanned with a two-state sub-scanner:

1. Consume digits into `num`.
2. If the next character is `.`, consume it and consume more digits → `REAL_LITERAL`.
3. Otherwise → `INTEGER_LITERAL`.

There is no exponent notation (`1e5`) — the pseudocode specification does not include it.

### 2.6 String and Character Literals

Double-quoted strings consume characters until the closing `"` or end-of-line. Single-quoted character literals (`'A'`) consume exactly one character and are emitted as `STRING_LITERAL` (not a distinct `CHAR_LITERAL` type) because the runtime treats characters as single-character strings.

### 2.7 Special Character Handling

The Cambridge pseudocode spec uses the **Unicode assignment arrow** `←` (U+2190). The lexer also accepts `<-` as a two-character ASCII alternative, producing the same `ASSIGN` token in both cases. Similarly, the typographic en-dash `–` (U+2013) is accepted alongside `-` as a subtraction operator.

### 2.8 Error Recovery

When the lexer encounters an unrecognised character, it:

1. Records a `LexerError` with precise line and column.
2. Emits an `UNKNOWN` token so the token stream remains intact.
3. Continues scanning.

This **error-and-continue** strategy allows the parser to receive a complete token stream and potentially report multiple independent errors in a single compilation run.

### 2.9 NEWLINE Tokens

The lexer emits explicit `NEWLINE` tokens. The parser immediately filters them out (`tokens.filter(t => t.type !== 'NEWLINE')`), but they are retained in the raw token stream so that the lexer can accurately record line numbers for all tokens.

---

## 3. Phase 2 — Syntax Analysis (Parsing)

**File:** `src/features/compiler/parser.ts`  
**Entry point:** `parse(tokens: Token[]): ParseResult`

### 3.1 Responsibility

The parser converts the flat token sequence into a **tree** that reflects the hierarchical grammatical structure of the program. It answers: *is this sequence of tokens a grammatically valid program, and if so, what does its structure look like?*

### 3.2 Parser Class

The parser is a **recursive-descent parser** — a handwritten implementation where each non-terminal in the grammar corresponds to a parsing function. This family of parsers is:

- **Top-down**: parsing begins at the start symbol (`Program`) and descends to terminals.
- **LL(1) with lookahead**: decisions are made by inspecting the next token (`peek()`), occasionally with one additional token of lookahead (`peek(1)`).
- **Error-recovering**: on a missing token, a synthetic token is inserted so parsing can continue.

### 3.3 Grammar (Informal)

```
Program        → Statement*
Statement      → InputStmt | OutputStmt | AssignStmt | IfStmt | CaseStmt
               | ForStmt | WhileStmt | RepeatStmt
               | DeclareStmt | ConstantStmt | TypeDecl
               | ProcedureDecl | FunctionDecl | CallStmt | ReturnStmt
               | OpenFile | ReadFile | WriteFile | CloseFile

Expression     → LogicalOr
LogicalOr      → LogicalAnd ( 'OR'  LogicalAnd )*
LogicalAnd     → Comparison ( 'AND' Comparison )*
Comparison     → Concat ( ( '=' | '<>' | '<' | '>' | '<=' | '>=' ) Concat )*
Concat         → AddSub ( '&' AddSub )*
AddSub         → MulDiv  ( ( '+' | '-' ) MulDiv  )*
MulDiv         → Unary   ( ( '*' | '/' | 'DIV' | 'MOD' ) Unary )*
Unary          → ( '-' | 'NOT' ) Unary | Power
Power          → Postfix ( '^' Unary )?     ← right-associative
Postfix        → Primary ( '.' IDENTIFIER )*
Primary        → '(' Expression ')'
               | INTEGER_LITERAL | REAL_LITERAL | STRING_LITERAL | BOOLEAN_LITERAL
               | IDENTIFIER '[' indices ']'     ← array access
               | IDENTIFIER '(' args ')'         ← function call
               | IDENTIFIER
```

### 3.4 Operator Precedence

Operator precedence is encoded by the **call depth** of the parsing functions. A lower function in the call stack binds more tightly. The full precedence ladder (lowest to highest):

| Level | Operators | Associativity |
|---|---|---|
| 1 (lowest) | `OR` | Left |
| 2 | `AND` | Left |
| 3 | `=`, `<>`, `<`, `>`, `<=`, `>=` | Left |
| 4 | `&` | Left |
| 5 | `+`, `-` | Left |
| 6 | `*`, `/`, `DIV`, `MOD` | Left |
| 7 | Unary `-`, `NOT` | Right |
| 8 | `^` | **Right** (see §3.5) |
| 9 (highest) | Postfix `.` | Left |

### 3.5 Right-Associativity of `^`

Most operators are left-associative (implemented with `while` loops). The power operator `^` is **right-associative** (`2^3^2` = `2^(3^2)` = 512, not `(2^3)^2` = 64). This is implemented by having `parsePower()` call `parseUnary()` (not itself) for the right operand:

```typescript
function parsePower(): Expression {
    const base = parsePostfix()
    if (check('POWER')) {
        const op = advance()
        const exp = parseUnary()   // ← recursion goes up, not into parsePower
        return BinaryExpr('^', base, exp)
    }
    return base
}
```

### 3.6 Statement Dispatch

`parseStatement()` dispatches on the **first token** of each statement. This works because the Cambridge pseudocode grammar is designed so that every statement form starts with a distinct keyword or a distinguishable token pattern:

```
INPUT       → InputStatement
OUTPUT      → OutputStatement
DECLARE     → DeclareStatement
CONSTANT    → ConstantStatement
IF          → IfStatement
CASE        → CaseStatement
FOR         → ForStatement
WHILE       → WhileStatement
REPEAT      → RepeatStatement
PROCEDURE   → ProcedureDecl
FUNCTION    → FunctionDecl
CALL        → CallStatement
RETURN      → ReturnStatement
TYPE        → TypeDecl
OPEN        → OpenFileStatement
READFILE    → ReadFileStatement
WRITEFILE   → WriteFileStatement
CLOSEFILE   → CloseFileStatement
IDENTIFIER  → AssignStatement  (target ← value)
```

### 3.7 Assignment vs Expression Ambiguity

An `IDENTIFIER` token can begin either an assignment statement (`x ← 5`) or — in theory — a bare expression. The parser resolves this by lookahead: after seeing an `IDENTIFIER`, if the next token is `ASSIGN` (`←` or `<-`), or if the identifier is followed by `[` (array access assignment), it parses an assignment. Otherwise it falls through to an error.

### 3.8 CASE Statement Body Parsing

The CASE statement poses a classic **multi-statement body** problem: each case clause (`value: stmt ...`) may contain multiple statements, but there is no explicit `ENDCASE` for individual clauses — only for the whole block. The parser uses a `isNextClauseStart()` predicate to determine when one clause body ends:

```
isNextClauseStart() = peek is OTHERWISE
                    | peek is INTEGER/REAL/STRING/BOOLEAN_LITERAL followed by COLON
                    | peek is ENDCASE
```

This lets the parser greedily consume statements into the current clause body until the next clause begins.

### 3.9 RETURN Statement Ambiguity

In the grammar, both procedures and functions use `RETURN`. Procedures use bare `RETURN` (no value); functions use `RETURN expr`. The parser uses `canStartExpression()` to look one token ahead: if the next token could start an expression (a literal, identifier, `(`, unary `-`, `NOT`), the return is parsed with a value; otherwise it is a bare return.

```typescript
const value = canStartExpression() ? parseExpression() : null
```

The semantic validity of the return (whether it is inside the right kind of callable) is enforced by the validator, not the parser. The parser only determines structure.

### 3.10 Error Recovery

When `expect(type)` fails, the parser:

1. Records a `ParseError`.
2. Returns a **synthetic token** of the expected type with the current position.
3. Resumes parsing as if the token were present.

This strategy is simple and prevents cascading errors caused by a single missing delimiter (e.g., a forgotten `ENDIF`). It does not implement full panic-mode recovery or synchronisation sets, which is acceptable for the short programs this compiler targets.

### 3.11 AST Design

All AST nodes implement the `Node` interface, which carries `line` and `column` fields. These propagate from the originating token and are used throughout the validator and at runtime to produce located error messages.

The `Expression` type is a **discriminated union**:

```typescript
type Expression = Literal | Identifier | BinaryExpr | UnaryExpr
                | FunctionCall | ArrayAccess | RecordAccess
```

Each variant has a unique `kind` string field, enabling exhaustive `switch` statements in the visitor-style code of the validator and interpreter. TypeScript's narrowing ensures that every case is handled at compile time.

---

## 4. Phase 3 — Semantic Analysis

**File:** `src/features/compiler/validator.ts`  
**Entry point:** `validate(program: Program): ValidationError[]`

### 4.1 Responsibility

Semantic analysis checks properties that the grammar cannot express: *does the program make sense?* The grammar can verify that `DECLARE x : INTEGER` is syntactically correct, but only the semantic analyser can verify that `x` is not declared twice, that `x` is declared before it is used, or that a constant is not assigned to.

### 4.2 Symbol Table Design

The validator uses a **linked-scope** symbol table. Each lexical scope is a `Scope` object holding a `Map<string, Symbol>` and a reference to its parent scope:

```
Global Scope
  └── Procedure/Function Scope
        └── Block Scope (IF branch, FOR body, etc.)
```

Lookups walk the chain from inner to outer scope. Name resolution is **case-insensitive**: all keys are normalised to uppercase before storage and lookup, matching the lexer's normalisation.

Each `Symbol` records:

| Field | Purpose |
|---|---|
| `kind` | `'variable'`, `'constant'`, `'procedure'`, `'function'`, `'type'` |
| `name` | Original casing (for error messages) |
| `dataType` | The declared type (used for record field validation) |
| `paramCount` | For callables — used for arity checking |
| `fields` | For `TYPE` declarations — used for record field existence checking |

### 4.3 Validation Context

The validation context tracks whether the analyser is currently inside a function, a procedure, or at the top level. It is threaded through all recursive calls as a discriminated literal:

```typescript
type ValidationContext = 'global' | 'function' | 'procedure'
```

This enables the `RETURN` statement rules:

| Location | Bare `RETURN` | `RETURN expr` |
|---|---|---|
| `global` | Error | Error |
| `procedure` | OK | Error |
| `function` | Error | OK |

### 4.4 Checks Performed

**Variable checks**
- Variable used before declaration (`OUTPUT x` without `DECLARE x`)
- Variable declared more than once in the same scope
- Assignment to a constant (`pi ← 3`)

**Type checks**
- Unknown primitive type name (`DECLARE x : Integr`)
- Unknown named type (`DECLARE book : TBook` without a prior `TYPE TBook`)
- Array element type must be a known type
- Record field must exist in the declared type

**Callable checks**
- Procedure not defined at call site
- Function not defined at call site
- Calling a non-procedure with `CALL`
- Wrong argument count for both procedures and functions

**Built-in function checks**
- The set of known built-ins (`LENGTH`, `LEFT`, `RIGHT`, `MID`, `ASC`, `CHR`, `INT`, `ROUND`, `UCASE`, `LCASE`, `NUM_TO_STR`, `STR_TO_NUM`, `IS_NUM`, `EOF`) is exempt from the "undefined function" check
- Arity is validated against a table with support for optional arguments:
  ```
  ROUND: accepts 1 or 2 arguments
  MID:   exactly 3 arguments
  ```

**Scope rules**
- Variables declared inside a procedure or function body are not visible outside it
- FOR loop variables are implicitly in scope within the loop body (injected into a new child scope)
- IF branches, WHILE bodies, etc. each get a fresh child scope

### 4.5 Forward Reference Policy

The validator uses a **single-pass, declaration-before-use** policy: a symbol must be declared in a textually prior statement before it is referenced. There is no pre-scan for forward declarations. This matches the Cambridge specification's intent that programs be readable top-to-bottom.

### 4.6 Validation Does Not Modify the AST

The validator is purely analytical. It produces a list of errors but does not annotate, transform, or augment the AST. This keeps the data flow simple: if the validator returns an empty list, the AST is passed as-is to the interpreter.

---

## 5. Phase 4 — Interpretation (Execution)

**File:** `src/features/compiler/interpreter.ts`  
**Entry point:** `interpret(program: Program, inputs: string[]): { output: string; error: string | null }`

### 5.1 Responsibility

The interpreter **executes** the program by traversing the AST recursively and performing the operations each node describes. It manages runtime values, controls program flow, handles I/O, and detects runtime errors.

### 5.2 Tree-Walking Interpretation

The interpreter is a classic **tree-walking interpreter**. Two mutually recursive functions do all the work:

- `evalExpr(expr, env, rt)` — evaluates an expression, returning a `PseudoValue`
- `executeStatement(stmt, env, rt)` — executes a statement, returning `void`

Both functions take the current `Environment` and `Runtime` as explicit parameters (rather than accessing global state), making every evaluation step traceable.

### 5.3 Expression Evaluation

Expressions are evaluated by structural recursion on the `kind` field:

**Literals** are parsed at evaluation time (not at parse time), converting the string representation in the AST to a TypeScript primitive:

```typescript
case 'INTEGER': return parseInt(expr.value, 10)
case 'REAL':    return parseFloat(expr.value)
case 'BOOLEAN': return expr.value.toUpperCase() === 'TRUE'
case 'STRING':  return expr.value
```

**Binary expressions** dispatch on the `operator` string. Short-circuit evaluation is implemented explicitly for `AND` and `OR`:

```typescript
case 'AND':
    const l = evalExpr(expr.left, env, rt)
    return l === false ? false : evalExpr(expr.right, env, rt)
```

This mirrors the JavaScript `&&`/`||` short-circuit semantics and avoids evaluating the right operand when the result is already determined.

**The `+` operator** is overloaded: if either operand is a string, it performs string concatenation; otherwise integer/real addition. This matches the Cambridge spec.

### 5.4 Short-Circuit Logical Operators

A subtlety: `OR` does not return `true`/`false` but rather the first truthy value or the last value — mirroring JavaScript's `||` semantics. This is consistent with the spec's intent (logical OR should return a boolean in context) because `OR` is only used in boolean contexts in Cambridge pseudocode.

### 5.5 Statement Execution

Control flow statements are implemented using the **host language's control flow**. A FOR loop in pseudocode becomes a `for` loop in TypeScript. A WHILE loop becomes a `while` loop. This is only possible because the source and target structures are isomorphic.

**For loop direction** is handled by inspecting the sign of `step`:

```typescript
if (step > 0) { for (let i = from; i <= to; i += step) ... }
else          { for (let i = from; i >= to; i += step) ... }
```

**STEP 0** is explicitly guarded: it would produce an infinite loop with no possibility of the condition becoming false, so it throws a `RuntimeError` immediately.

### 5.6 Closures and the Environment Chain

When a procedure or function is declared, it captures its **declaration-time environment** as a closure:

```typescript
case 'ProcedureDecl': {
    const callable: PseudoCallable = {
        kind: 'callable',
        type: 'procedure',
        params: ...,
        body: s.body,
        closure: env,          // ← lexical scope captured here
    }
    env.define(s.name, callable)
}
```

When the callable is later invoked, a new `Environment` is created with the *closure* (not the call-site environment) as its parent:

```typescript
const fnEnv = new Environment(callable.closure)
callable.params.forEach((p, i) => fnEnv.define(p.name, args[i] ?? 0))
executeStatements(callable.body, fnEnv, rt)
```

This implements **lexical (static) scoping**: the procedure sees the variables that were in scope where it was *defined*, not where it was *called*. It also enables recursion, since a named function is defined in the enclosing scope before its body executes, so recursive calls resolve correctly.

### 5.7 RETURN as a Control-Flow Exception

The RETURN statement cannot be implemented as a normal return from `executeStatement()` because `executeStatement()` returns `void` and the return may happen deep inside nested calls to `executeStatements()`. The solution is a **non-local exit via exception**:

```typescript
case 'ReturnStatement':
    throw new ReturnSignal(stmt.value !== null ? evalExpr(stmt.value, env, rt) : null)
```

`ReturnSignal` is a dedicated class (not a subclass of `Error`) that the calling function/procedure catches:

```typescript
// In FunctionCall evaluation:
try {
    executeStatements(callable.body, fnEnv, rt)
} catch (e) {
    if (e instanceof ReturnSignal) {
        if (e.value === null) throw new RuntimeError(...)
        return e.value
    }
    throw e   // re-throw genuine runtime errors
}
```

Procedures catch and discard the signal (they ignore the return value); functions require a non-null value. Any `ReturnSignal` that is neither a procedure nor function return propagates to the top-level `interpret()`, where it is caught and treated as a graceful program exit.

### 5.8 Array Storage

Arrays are stored as `PseudoArray` objects whose `data` field is a `Map<string, PseudoValue>`. The key is a **tuple string** built from the evaluated indices, joined by the null character `\x00` as a separator:

```typescript
const key = indices.map(i => String(evalExpr(i, env, rt))).join('\x00')
```

Using `\x00` as a separator prevents collisions between multi-dimensional array accesses (e.g., `[1, 2]` and `[12]` would collide with a comma separator but cannot with `\x00`). Arrays do not enforce declared bounds at runtime — out-of-bounds access returns a default value of `0`.

### 5.9 Record Storage

Records are stored as `PseudoRecord` objects whose `data` field is a `Map<string, PseudoValue>`. Record access (`rec.field`) simply looks up the field name in this map. User-defined `TYPE` records are initialised as empty maps; field access on an uninitialised field returns `0`.

### 5.10 Built-in Functions

Built-in functions are handled inline within the `FunctionCall` case of `evalExpr()`, dispatched on the uppercased function name:

```
LENGTH  → String(args[0]).length
LEFT    → String(args[0]).slice(0, args[1])
RIGHT   → String(args[0]).slice(s.length - args[1])
MID     → String(args[0]).slice(start - 1, start - 1 + len)  ← 1-indexed
ASC     → String(args[0]).charCodeAt(0)
CHR     → String.fromCharCode(args[0])
INT     → Math.trunc(args[0])
ROUND   → Number(args[0].toFixed(args[1])) or Math.round(args[0])
UCASE   → String(args[0]).toUpperCase()
LCASE   → String(args[0]).toLowerCase()
NUM_TO_STR → String(args[0])
STR_TO_NUM → Number(args[0])
IS_NUM  → !isNaN(Number(args[0]))
EOF     → false  (file I/O is not simulated)
```

If the name does not match a built-in, control falls through to the user-defined function lookup.

### 5.11 Step Limit (Infinite Loop Guard)

Every significant operation (entering a loop iteration, calling a statement) increments a step counter in the `Runtime` object. When the counter exceeds `maxSteps` (default: 100,000), a `RuntimeError` is thrown:

```typescript
tick(): void {
    if (++this.steps > this.maxSteps)
        throw new RuntimeError('Step limit exceeded — check for infinite loops')
}
```

This prevents the browser from freezing on programs containing infinite loops.

---

## 6. Phase 5 — Evaluation

**File:** `src/features/compiler/evaluate.ts`  
**Entry point:** `evaluate(program: Program, testCases: TestCase[]): TestResult[]`

### 6.1 Responsibility

Evaluation runs the program against a set of predefined test cases and determines whether the outputs match expected values. It is separate from interpretation because it concerns *correctness* rather than *execution*.

### 6.2 Output Matching Strategy

A naive string comparison would fail on many valid student solutions (e.g., `"The sum is 8"` is a correct output for expected `"8"`). The evaluator uses a **three-tier matching strategy**, tried in order:

**Tier 1 — Normalised exact match**
```
normalise(actual) === normalise(expected)
```
where `normalise` collapses multiple whitespace characters to a single space and strips leading/trailing whitespace.

**Tier 2 — Case-insensitive substring match** (non-numeric expected values only)
```
normActual.toLowerCase().includes(normExpected.toLowerCase())
```
This handles outputs like `"Grade: Pass"` matching expected `"Pass"`. The check is **skipped for numeric expected values** to prevent false positives (`"100"` matching expected `"10"` via substring).

**Tier 3 — Numeric tolerance match**
```
withinTolerance(n, expNum)  for any n in extractNumbers(normActual)
```
where `withinTolerance(a, b)` is:
- If `b === 0`: `|a| < 10^-9` (near-zero check)
- Otherwise: `|a - b| / |b| < 0.01` (1% relative tolerance)

This handles floating-point approximations: `98.60000000000001` matches expected `98.6`.

### 6.3 Number Extraction

`extractNumbers(s)` applies the regex `/-?\d+(\.\d+)?/g` to extract all numbers embedded in the output string. This allows matching when the student outputs `"Surface area: 78.5398"` against expected `"78.5398"`.

---

## 7. Runtime Model

**File:** `src/features/compiler/runtime.ts`

### 7.1 PseudoValue

The runtime value universe is a TypeScript union:

```typescript
type PseudoValue = number | boolean | string | PseudoArray | PseudoRecord
```

There is no distinction between `INTEGER` and `REAL` at runtime — both are JavaScript `number`. The declared type in the source affects only the default initialisation value (integers default to `0`, reals to `0`), not the runtime representation.

### 7.2 Environment

The `Environment` class is the runtime analogue of the validator's `Scope`. It stores bindings as `Map<string, { value: PseudoValue; constant: boolean }>`.

The key operations:

- `define(name, value, constant)` — creates a new binding in the **current** environment frame; case-insensitive (keys normalised to uppercase)
- `get(name)` — looks up by walking the parent chain; throws `RuntimeError` if not found
- `set(name, value)` — updates an existing binding; walks the parent chain to find the frame that owns the binding; throws if the binding is a constant or does not exist anywhere in the chain

The strict `set()` behaviour enforces that variables cannot be used without prior declaration at runtime (complementing the validator's static check). The parent-chain walk in `set()` ensures that assignments inside loops and branches correctly update the variable in the outer scope that owns it.

### 7.3 Runtime I/O

The `Runtime` class manages two streams:

- **Input queue** (`string[]`): pre-loaded with test inputs. `readInput()` dequeues one item. If the queue is empty, a `RuntimeError` is thrown.
- **Output buffer** (`string[]`): `writeOutput(value)` appends. `getOutput()` joins with newlines.

There is no asynchronous I/O; all inputs are known before execution begins.

### 7.4 PseudoCallable

Callables (procedures and functions) are stored in the environment as `PseudoCallable` objects. They are **not** a `PseudoValue` subtype — the union is kept separate to prevent accidentally using a callable where a value is expected. The interpreter's `Identifier` case guards against this:

```typescript
if (val.kind === 'callable')
    throw new RuntimeError(`'${name}' is a procedure/function, not a value`)
```

### 7.5 ReturnSignal

`ReturnSignal` is a **control-flow exception**, not an error. It extends nothing (not `Error`) and carries an optional `PseudoValue | null`. The `null` case represents a bare `RETURN` in a procedure; a non-null value is the return value of a function. This separation avoids the need for a separate out-of-band return mechanism.

---

## 8. Error Architecture

### 8.1 Error Categories

Errors flow from three phases, each with a distinct `source` tag:

| Source | Tag | Examples |
|---|---|---|
| Lexer | `'lexer'` → displayed as **Syntax** | Unexpected character, unterminated string |
| Parser | `'parser'` → displayed as **Structure** | Missing `ENDIF`, unexpected token |
| Validator | `'validator'` → displayed as **Semantic** | Undeclared variable, type mismatch |

### 8.2 Error Accumulation vs. Short-Circuiting

The pipeline **accumulates** errors within each phase but **short-circuits** between phases:

- The lexer collects all `LexerError`s in a single pass.
- The parser collects all `ParseError`s via error recovery.
- **If any lexer or parser errors exist, validation is skipped.** An incomplete or malformed AST would cause the validator to produce misleading secondary errors that distract from the root cause.
- The interpreter is never invoked if there are compile errors.

### 8.3 Precise Location Information

Every error carries `line` and `column` numbers. These originate at the **token** level (the lexer attaches positions to each token) and propagate upward through the AST nodes. The `Node` base interface requires every AST node to carry `line` and `column`, which are copied from the token that began that construct.

---

## 9. The Type System

### 9.1 Source-Level Types

The Cambridge pseudocode type system is simple and nominal:

| Type | Default value | Notes |
|---|---|---|
| `INTEGER` | `0` | Whole numbers |
| `REAL` | `0` | Floating-point numbers |
| `STRING` | `""` | Arbitrary-length text |
| `CHAR` | `""` | Single character (stored as `STRING` at runtime) |
| `BOOLEAN` | `false` | `TRUE` or `FALSE` |
| `DATE` | `""` | Date value (stored as `STRING` at runtime) |
| `ARRAY[l:u] OF T` | `{ kind: 'array', data: Map }` | Multi-dimensional supported |
| User-defined type | `{ kind: 'record', data: Map }` | Declared with `TYPE...ENDTYPE` |

### 9.2 Static vs Dynamic Typing

The compiler performs **limited static type checking**: it validates that named types exist and that record fields exist within their type. It does **not** perform full type inference or type-compatibility checking (e.g., assigning a `STRING` to an `INTEGER` variable is not caught statically). This matches the Cambridge spec, which specifies type names for declaration purposes but does not describe a type-checking algorithm.

At runtime, types are not enforced. A variable declared as `INTEGER` can hold a `REAL` value. This reflects JavaScript's dynamic nature and is acceptable for the educational context.

### 9.3 TypeScript Types vs PseudoValue Types

There is a deliberate **two-level type system**:

- **TypeScript types** (compile time): ensure the compiler's own code is type-safe. `BinaryOperator`, `UnaryOperator`, `Expression`, `Statement`, `PseudoValue` are all TypeScript union types that the TypeScript compiler checks exhaustively.
- **Pseudocode types** (runtime): validated loosely by the validator and enforced not at all by the interpreter.

The TypeScript discriminated unions (`kind: 'Literal' | 'Identifier' | ...`) enable `switch` exhaustiveness checking: if a new AST node type is added but not handled in the interpreter or validator, the TypeScript compiler produces a build error.

---

## 10. Design Trade-offs and Constraints

### 10.1 No Intermediate Representation

A production compiler would lower the AST to one or more IRs (e.g., three-address code, SSA form) before code generation. This compiler skips that step entirely. The trade-off:

- **Pro**: smaller codebase, simpler mental model, no IR-specific bugs
- **Con**: optimisation is impossible (e.g., constant folding, dead code elimination) — acceptable since performance is not a goal

### 10.2 No Type Inference

Type inference (Hindley-Milner or similar) would allow the compiler to detect type errors like `DECLARE x : INTEGER\nx ← "hello"`. The current design skips this entirely. The trade-off:

- **Pro**: dramatically simpler validator; spec-compliant (Cambridge pseudocode doesn't define type-checking rules beyond declaration)
- **Con**: runtime type errors are possible after a clean compile

### 10.3 Single-Pass Validation

The validator makes a single left-to-right pass and does not pre-scan for forward declarations. A consequence: mutually recursive procedures would require the second procedure to be declared before the first calls it. The Cambridge spec's imperative, top-down style makes this an acceptable constraint in practice.

### 10.4 No Bytecode or JIT

The interpreter re-traverses the same AST nodes on every execution (e.g., the loop body AST nodes are re-evaluated on each iteration). A production interpreter would compile to bytecode or use JIT compilation to avoid this overhead. At the scale of educational exercises (hundreds of iterations at most), tree-walking is fast enough.

### 10.5 File I/O is Silently Ignored

`OPEN`, `READFILE`, `WRITEFILE`, `CLOSEFILE` statements are parsed and validated (the validator checks that referenced variables are declared) but the interpreter silently ignores them. `EOF()` always returns `false`. This is a deliberate simplification: file I/O cannot be simulated meaningfully in a browser environment without a real filesystem.

### 10.6 Error-Tolerant Parsing but Not Execution

The lexer and parser are designed to produce useful output even on invalid input. The interpreter is not — it throws and exits at the first `RuntimeError`. This reflects the different audiences: compile errors help the student understand what is wrong with their code; runtime errors during test-case evaluation are failure signals, not learning opportunities.

### 10.7 Scope Rules vs the Cambridge Specification

The Cambridge spec does not precisely define scoping rules. The implementation makes pragmatic choices:

- All scopes are **lexical** (static)
- Procedures and functions see their closure environment
- Variables declared in an `IF` branch are not visible after `ENDIF`
- The FOR loop variable is implicitly in scope for the body but its lifetime ends at `NEXT`

These choices follow common language design practice and produce the most predictable behaviour for students.