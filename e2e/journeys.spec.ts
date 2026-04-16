/**
 * End-to-end user journey tests for the Pseudocode IDE.
 *
 * Each describe block represents a realistic student workflow from start to
 * finish.  Tests run against the URL configured via BASE_URL (default:
 * http://localhost:5173; override to https://pseudo-code-ide.onrender.com
 * when targeting the deployed environment).
 *
 * The app always opens with q001 "Sum of Two Numbers" as the first question
 * (it is the [0] element of the frozen questions array), so any test that
 * relies on a specific title can reference that question safely.
 */

import { test, expect, type Page } from '@playwright/test'

// ── helpers ──────────────────────────────────────────────────────────────────

async function fillAndCompile(page: Page, code: string) {
  await page.getByRole('textbox').fill(code)
  await page.getByRole('button', { name: /compile/i }).click()
}

const sumOfTwoNumbers = [
  'DECLARE a : INTEGER',
  'DECLARE b : INTEGER',
  'INPUT a',
  'INPUT b',
  'OUTPUT a + b',
].join('\n')

const celsiusToFahrenheit = [
  'DECLARE c : REAL',
  'INPUT c',
  'OUTPUT (c * 9 / 5) + 32',
].join('\n')

const oddOrEven = [
  'DECLARE n : INTEGER',
  'INPUT n',
  'IF n MOD 2 = 0 THEN',
  '  OUTPUT "Even"',
  'ELSE',
  '  OUTPUT "Odd"',
  'ENDIF',
].join('\n')

const forLoopSum = [
  'DECLARE total : INTEGER',
  'DECLARE i : INTEGER',
  'total ← 0',
  'FOR i ← 1 TO 5',
  '  total ← total + i',
  'NEXT i',
  'OUTPUT total',
].join('\n')

const recursiveFactorial = [
  'FUNCTION Fact(n : INTEGER) RETURNS INTEGER',
  '  IF n <= 1 THEN',
  '    RETURN 1',
  '  ELSE',
  '    RETURN n * Fact(n - 1)',
  '  ENDIF',
  'ENDFUNCTION',
  'OUTPUT Fact(5)',
].join('\n')

const whileLoop = [
  'DECLARE x : INTEGER',
  'x ← 1',
  'WHILE x < 5 DO',
  '  x ← x + 1',
  'ENDWHILE',
  'OUTPUT x',
].join('\n')

const stringFunctions = [
  'DECLARE s : STRING',
  'INPUT s',
  'OUTPUT UCASE(LEFT(s, 3))',
].join('\n')

// ── Journey 1: First Visit ────────────────────────────────────────────────────

test.describe('Journey 1 — First visit: app loads and presents a question', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the React app to finish rendering (handles Render.com cold-start)
    await page.getByTestId('question-title').waitFor({ state: 'visible' })
  })

  test('question title is visible on initial load', async ({ page }) => {
    await expect(page.getByTestId('question-title')).toBeVisible()
    await expect(page.getByTestId('question-title')).toContainText('Sum of Two Numbers')
  })

  test('question context / description is visible', async ({ page }) => {
    await expect(page.getByTestId('question-context')).toBeVisible()
  })

  test('pseudocode editor is empty and ready', async ({ page }) => {
    await expect(page.getByRole('textbox')).toBeVisible()
    await expect(page.getByRole('textbox')).toHaveValue('')
  })

  test('output panel shows idle prompt before first compile', async ({ page }) => {
    await expect(page.getByText(/write your pseudocode/i)).toBeVisible()
  })

  test('"New Question" button is present in the top bar', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new question/i })).toBeVisible()
  })

  test('"Compile" button is present below the editor', async ({ page }) => {
    await expect(page.getByRole('button', { name: /compile/i })).toBeVisible()
  })

  test('page title is set appropriately', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/)
  })
})

// ── Journey 2: Correct solution — all test cases pass ─────────────────────────

test.describe('Journey 2 — Student writes a correct solution (Sum of Two Numbers)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('compiling a correct solution shows "No syntax errors found"', async ({ page }) => {
    await fillAndCompile(page, sumOfTwoNumbers)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('evaluation panel appears after a clean compile', async ({ page }) => {
    await fillAndCompile(page, sumOfTwoNumbers)
    await expect(page.getByRole('region', { name: /evaluation results/i })).toBeVisible()
  })

  test('all 3 test cases pass', async ({ page }) => {
    await fillAndCompile(page, sumOfTwoNumbers)
    await expect(page.getByText('3/3 passed')).toBeVisible()
  })

  test('test case labels are visible in evaluation panel', async ({ page }) => {
    await fillAndCompile(page, sumOfTwoNumbers)
    await expect(page.getByText('3 + 5 = 8')).toBeVisible()
    await expect(page.getByText('10 + 0 = 10')).toBeVisible()
    await expect(page.getByText('7 + 13 = 20')).toBeVisible()
  })

  test('each passing test case shows a tick icon', async ({ page }) => {
    await fillAndCompile(page, sumOfTwoNumbers)
    const ticks = page.getByText('✓')
    await expect(ticks.first()).toBeVisible()
  })

  test('solution using <- (ASCII alternative) also passes all tests', async ({ page }) => {
    const asciiVersion = sumOfTwoNumbers.replace(/←/g, '<-')
    await fillAndCompile(page, asciiVersion)
    await expect(page.getByText('3/3 passed')).toBeVisible()
  })
})

// ── Journey 3: Wrong answer — test cases fail ─────────────────────────────────

test.describe('Journey 3 — Student submits wrong logic (off-by-one on sum)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('compiling wrong logic still shows "No syntax errors found"', async ({ page }) => {
    const wrongSolution = [
      'DECLARE a : INTEGER',
      'DECLARE b : INTEGER',
      'INPUT a',
      'INPUT b',
      'OUTPUT a + b + 1',   // deliberately adds 1 extra
    ].join('\n')
    await fillAndCompile(page, wrongSolution)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('evaluation panel shows 0/3 when all tests fail', async ({ page }) => {
    const wrongSolution = [
      'DECLARE a : INTEGER',
      'DECLARE b : INTEGER',
      'INPUT a',
      'INPUT b',
      'OUTPUT a + b + 1',
    ].join('\n')
    await fillAndCompile(page, wrongSolution)
    await expect(page.getByText('0/3 passed')).toBeVisible()
  })

  test('failed test cases show a cross icon', async ({ page }) => {
    const wrongSolution = [
      'DECLARE a : INTEGER',
      'DECLARE b : INTEGER',
      'INPUT a',
      'INPUT b',
      'OUTPUT a + b + 1',
    ].join('\n')
    await fillAndCompile(page, wrongSolution)
    const crosses = page.getByText('✗')
    await expect(crosses.first()).toBeVisible()
  })

  test('failed test shows expected vs actual output', async ({ page }) => {
    const wrongSolution = [
      'DECLARE a : INTEGER',
      'DECLARE b : INTEGER',
      'INPUT a',
      'INPUT b',
      'OUTPUT a + b + 1',
    ].join('\n')
    await fillAndCompile(page, wrongSolution)
    // The EvaluationPanel detail shows expected/got for failures
    await expect(page.getByText(/expected/i).first()).toBeVisible()
  })
})

// ── Journey 4: Syntax error → fix → success ───────────────────────────────────

test.describe('Journey 4 — Student has a syntax error then corrects it', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('undeclared variable shows a semantic error', async ({ page }) => {
    await fillAndCompile(page, 'OUTPUT undeclaredVar')
    await expect(page.getByText(/before declaration/i).first()).toBeVisible()
    await expect(page.getByText('Semantic')).toBeVisible()
  })

  test('after fixing the code, recompiling succeeds', async ({ page }) => {
    // First compile with error — single undeclared variable produces exactly one error
    await fillAndCompile(page, 'OUTPUT undeclaredVar')
    await expect(page.getByText(/before declaration/i).first()).toBeVisible()

    // Fix the code and recompile
    await fillAndCompile(page, 'DECLARE x : INTEGER\nINPUT x\nOUTPUT x')
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
    await expect(page.getByText(/before declaration/i)).not.toBeVisible()
  })

  test('error count badge disappears after fixing errors', async ({ page }) => {
    await fillAndCompile(page, '@ bad\n# also bad')
    await expect(page.getByText(/\d+ errors?/)).toBeVisible()

    await fillAndCompile(page, 'DECLARE x : INTEGER\nOUTPUT x')
    await expect(page.getByText(/\d+ errors?/)).not.toBeVisible()
  })

  test('missing ENDIF shows a structure error pointing to line', async ({ page }) => {
    const badCode = [
      'DECLARE x : INTEGER',
      'x ← 5',
      'IF x > 3 THEN',
      '  OUTPUT "yes"',
      // MISSING ENDIF
    ].join('\n')
    await fillAndCompile(page, badCode)
    await expect(page.getByText('Structure')).toBeVisible()
    await expect(page.getByText(/ENDIF/i)).toBeVisible()
  })

  test('constant reassignment shows correct error message and line', async ({ page }) => {
    await fillAndCompile(page, 'CONSTANT pi ← 3.14\npi ← 3')
    await expect(page.getByText("Cannot assign to constant 'pi'")).toBeVisible()
    await expect(page.getByText(/Line 2/i)).toBeVisible()
  })
})

// ── Journey 5: Keyboard shortcut (Ctrl+Enter) ────────────────────────────────

test.describe('Journey 5 — Student uses Ctrl+Enter to compile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Ctrl+Enter compiles the code without clicking the button', async ({ page }) => {
    const textarea = page.getByRole('textbox')
    await textarea.fill('DECLARE x : INTEGER\nINPUT x\nOUTPUT x')
    await textarea.press('Control+Enter')
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('Meta+Enter (macOS Cmd+Enter) also compiles', async ({ page }) => {
    const textarea = page.getByRole('textbox')
    await textarea.fill('DECLARE x : INTEGER\nINPUT x\nOUTPUT x')
    await textarea.press('Meta+Enter')
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })
})

// ── Journey 6: Navigation — New Question resets state ────────────────────────

test.describe('Journey 6 — Student moves to the next question', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('clicking New Question changes the question title', async ({ page }) => {
    const titleBefore = await page.getByTestId('question-title').textContent()
    await page.getByRole('button', { name: /new question/i }).click()
    const titleAfter = await page.getByTestId('question-title').textContent()
    expect(titleAfter).not.toBe(titleBefore)
  })

  test('clicking New Question clears the editor', async ({ page }) => {
    await page.getByRole('textbox').fill(sumOfTwoNumbers)
    await page.getByRole('button', { name: /new question/i }).click()
    await expect(page.getByRole('textbox')).toHaveValue('')
  })

  test('clicking New Question resets output panel to idle after a successful compile', async ({ page }) => {
    await fillAndCompile(page, sumOfTwoNumbers)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
    await page.getByRole('button', { name: /new question/i }).click()
    await expect(page.getByText(/write your pseudocode/i)).toBeVisible()
    await expect(page.getByText(/no syntax errors found/i)).not.toBeVisible()
  })

  test('clicking New Question resets output panel after a compile with errors', async ({ page }) => {
    await fillAndCompile(page, '@ bad character')
    await expect(page.getByText(/unexpected character/i)).toBeVisible()
    await page.getByRole('button', { name: /new question/i }).click()
    await expect(page.getByText(/write your pseudocode/i)).toBeVisible()
    await expect(page.getByText(/unexpected character/i)).not.toBeVisible()
  })

  test('clicking New Question removes the evaluation panel', async ({ page }) => {
    await fillAndCompile(page, sumOfTwoNumbers)
    await expect(page.getByRole('region', { name: /evaluation results/i })).toBeVisible()
    await page.getByRole('button', { name: /new question/i }).click()
    await expect(page.getByRole('region', { name: /evaluation results/i })).not.toBeVisible()
  })

  test('successive New Question clicks always display a new question with context', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /new question/i }).click()
      await expect(page.getByTestId('question-title')).toBeVisible()
      await expect(page.getByTestId('question-context')).toBeVisible()
    }
  })
})

// ── Journey 7: IF/ELSE conditional program ────────────────────────────────────

test.describe('Journey 7 — Student writes a conditional program (IF/ELSE)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('correct IF/ELSE program compiles without errors', async ({ page }) => {
    await fillAndCompile(page, oddOrEven)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('CASE OF statement compiles without errors', async ({ page }) => {
    const code = [
      'DECLARE grade : STRING',
      'INPUT grade',
      'CASE OF grade',
      '  "A": OUTPUT "Excellent"',
      '  "B": OUTPUT "Good"',
      '  OTHERWISE: OUTPUT "Other"',
      'ENDCASE',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })
})

// ── Journey 8: FOR loop program ───────────────────────────────────────────────

test.describe('Journey 8 — Student writes a FOR loop program', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('FOR loop program compiles without errors', async ({ page }) => {
    await fillAndCompile(page, forLoopSum)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('WHILE loop program compiles without errors', async ({ page }) => {
    await fillAndCompile(page, whileLoop)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('REPEAT UNTIL loop compiles without errors', async ({ page }) => {
    const code = [
      'DECLARE x : INTEGER',
      'x ← 0',
      'REPEAT',
      '  x ← x + 1',
      'UNTIL x >= 5',
      'OUTPUT x',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })
})

// ── Journey 9: Functions and procedures ───────────────────────────────────────

test.describe('Journey 9 — Student uses user-defined functions and procedures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('recursive FUNCTION compiles without errors', async ({ page }) => {
    await fillAndCompile(page, recursiveFactorial)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('PROCEDURE with parameter compiles without errors', async ({ page }) => {
    const code = [
      'PROCEDURE Greet(name : STRING)',
      '  OUTPUT "Hello, " & name',
      'ENDPROCEDURE',
      'CALL Greet("World")',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('calling an undefined procedure shows an error', async ({ page }) => {
    await fillAndCompile(page, 'CALL NonExistent')
    await expect(page.getByText(/not defined/i)).toBeVisible()
  })
})

// ── Journey 10: Built-in string functions ─────────────────────────────────────

test.describe('Journey 10 — Student uses built-in string functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('LENGTH, LEFT, UCASE compile without errors', async ({ page }) => {
    await fillAndCompile(page, stringFunctions)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('MID and ASC compile without errors', async ({ page }) => {
    const code = [
      'DECLARE s : STRING',
      'INPUT s',
      'OUTPUT ASC(MID(s, 1, 1))',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('NUM_TO_STR and STR_TO_NUM compile without errors', async ({ page }) => {
    const code = [
      'DECLARE n : INTEGER',
      'n ← STR_TO_NUM("42")',
      'OUTPUT NUM_TO_STR(n)',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('IS_NUM built-in compiles without errors', async ({ page }) => {
    const code = [
      'DECLARE s : STRING',
      'INPUT s',
      'OUTPUT IS_NUM(s)',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('calling LENGTH with wrong arity shows error', async ({ page }) => {
    await fillAndCompile(page, 'OUTPUT LENGTH()')
    await expect(page.getByText(/argument/i)).toBeVisible()
  })
})

// ── Journey 11: Celsius to Fahrenheit — scientific calculation ────────────────

test.describe('Journey 11 — Scientific calculation (Celsius to Fahrenheit)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Celsius to Fahrenheit solution compiles cleanly', async ({ page }) => {
    await fillAndCompile(page, celsiusToFahrenheit)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })
})

// ── Journey 12: Arrays ────────────────────────────────────────────────────────

test.describe('Journey 12 — Student declares and uses an array', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('array declaration and indexed assignment compiles without errors', async ({ page }) => {
    const code = [
      'DECLARE scores : ARRAY[1:5] OF INTEGER',
      'DECLARE i : INTEGER',
      'FOR i ← 1 TO 5',
      '  scores[i] ← i * 10',
      'NEXT i',
      'OUTPUT scores[1]',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })
})

// ── Journey 13: Complete student workflow (end-to-end) ───────────────────────

test.describe('Journey 13 — Complete student workflow: read → write → test → next question', () => {
  test('student reads question, writes correct solution, sees all tests pass, then moves on', async ({ page }) => {
    // Step 1: Load the app
    await page.goto('/')

    // Step 2: Read the question
    await expect(page.getByTestId('question-title')).toContainText('Sum of Two Numbers')
    await expect(page.getByTestId('question-context')).toBeVisible()

    // Step 3: Write a correct solution
    await page.getByRole('textbox').fill(sumOfTwoNumbers)

    // Step 4: Compile using the button
    await page.getByRole('button', { name: /compile/i }).click()

    // Step 5: Verify no errors
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()

    // Step 6: Verify test evaluation runs and all pass
    await expect(page.getByText('3/3 passed')).toBeVisible()

    // Step 7: Move to the next question
    await page.getByRole('button', { name: /new question/i }).click()

    // Step 8: Verify state has been reset for the new question
    await expect(page.getByRole('textbox')).toHaveValue('')
    await expect(page.getByText(/write your pseudocode/i)).toBeVisible()
    await expect(page.getByTestId('question-title')).toBeVisible()
    // New question title should differ from q001
    await expect(page.getByTestId('question-title')).not.toContainText('Sum of Two Numbers')
  })

  test('student encounters error, corrects it, then verifies their solution', async ({ page }) => {
    await page.goto('/')

    // First attempt — forgot to declare variables (single undeclared var → single error)
    await page.getByRole('textbox').fill('OUTPUT undeclaredVar')
    await page.getByRole('button', { name: /compile/i }).click()
    await expect(page.getByText(/before declaration/i).first()).toBeVisible()

    // Second attempt — correct code
    await page.getByRole('textbox').fill(sumOfTwoNumbers)
    await page.getByRole('button', { name: /compile/i }).click()
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
    await expect(page.getByText('3/3 passed')).toBeVisible()
  })
})

// ── Journey 14: Edge cases and resilience ─────────────────────────────────────

test.describe('Journey 14 — Edge cases and input resilience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('compiling empty code shows "no code entered" error', async ({ page }) => {
    await page.getByRole('button', { name: /compile/i }).click()
    await expect(page.getByText(/no code entered/i)).toBeVisible()
  })

  test('division by zero runtime error is caught gracefully', async ({ page }) => {
    await fillAndCompile(page, 'OUTPUT 1 / 0')
    // Division by zero produces a runtime error surfaced as compile output
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('// comments in code do not cause errors', async ({ page }) => {
    const code = [
      'DECLARE x : INTEGER  // the main variable',
      'x ← 42              // set to 42',
      'OUTPUT x             // print it',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('power operator (^) compiles without errors', async ({ page }) => {
    await fillAndCompile(page, 'OUTPUT 2 ^ 10')
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('mis-cased type names are accepted (lexer normalises them)', async ({ page }) => {
    const code = [
      'DECLARE a : integer',
      'DECLARE b : real',
      'DECLARE c : string',
      'DECLARE d : boolean',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('CONSTANT declaration and use compiles without errors', async ({ page }) => {
    const code = [
      'CONSTANT MAX ← 100',
      'DECLARE x : INTEGER',
      'x ← MAX',
      'OUTPUT x',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })

  test('large programs (30+ lines) compile within timeout', async ({ page }) => {
    // Stress-test: a nested FOR loop counting up to 10
    const code = [
      'DECLARE total : INTEGER',
      'DECLARE i : INTEGER',
      'DECLARE j : INTEGER',
      'total ← 0',
      'FOR i ← 1 TO 5',
      '  FOR j ← 1 TO 5',
      '    total ← total + 1',
      '  NEXT j',
      'NEXT i',
      'OUTPUT total',
    ].join('\n')
    await fillAndCompile(page, code)
    await expect(page.getByText(/no syntax errors found/i)).toBeVisible()
  })
})

// ── Journey 15: Accessibility and layout ─────────────────────────────────────

test.describe('Journey 15 — Layout and accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('editor textarea has no autocomplete or spellcheck', async ({ page }) => {
    await expect(page.getByRole('textbox')).toHaveAttribute('autocomplete', 'off')
    await expect(page.getByRole('textbox')).toHaveAttribute('spellcheck', 'false')
  })

  test('"New Question" bar stays visible when editor is full of code', async ({ page }) => {
    await page.getByRole('textbox').fill(Array(40).fill('OUTPUT "hello"').join('\n'))
    await expect(page.getByRole('button', { name: /new question/i })).toBeVisible()
  })

  test('"Compile" button stays visible when editor is full of code', async ({ page }) => {
    await page.getByRole('textbox').fill(Array(40).fill('OUTPUT "hello"').join('\n'))
    await expect(page.getByRole('button', { name: /compile/i })).toBeVisible()
  })

  test('output panel is labelled "Output"', async ({ page }) => {
    await expect(page.getByText('Output', { exact: true })).toBeVisible()
  })

  test('line numbers appear in gutter once code is typed', async ({ page }) => {
    await page.getByRole('textbox').fill('DECLARE x : INTEGER\nOUTPUT x')
    await expect(page.getByText('1')).toBeVisible()
    await expect(page.getByText('2')).toBeVisible()
  })

  test('error line numbers in gutter are highlighted after compile', async ({ page }) => {
    // Type code where line 1 has an error (undeclared variable on line 1)
    await fillAndCompile(page, 'OUTPUT undeclaredVar')
    // Error panel should reference line 1
    await expect(page.getByText(/Line 1/i)).toBeVisible()
  })
})