import { test, expect } from '@playwright/test'

test.describe('Pseudocode IDE', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Question display', () => {
    test('loads with a question title visible', async ({ page }) => {
      await expect(page.getByTestId('question-title')).toBeVisible()
    })

    test('shows the New Question button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /new question/i })).toBeVisible()
    })

    test('clicking New Question changes the displayed question', async ({ page }) => {
      const titleBefore = await page.getByTestId('question-title').textContent()
      await page.getByRole('button', { name: /new question/i }).click()
      const titleAfter = await page.getByTestId('question-title').textContent()
      expect(titleAfter).not.toBe(titleBefore)
    })

    test('New Question button is always visible (not scrolled away)', async ({ page }) => {
      await expect(page.getByRole('button', { name: /new question/i })).toBeVisible()
      // Fill editor with many lines to simulate scrolling
      await page.getByRole('textbox').fill(Array(30).fill('OUTPUT "hello"').join('\n'))
      await expect(page.getByRole('button', { name: /new question/i })).toBeVisible()
    })

    test('Compile button is always visible (not scrolled away)', async ({ page }) => {
      await page.getByRole('textbox').fill(Array(30).fill('OUTPUT "hello"').join('\n'))
      await expect(page.getByRole('button', { name: /compile/i })).toBeVisible()
    })
  })

  test.describe('Bottom section — Editor', () => {
    test('shows the pseudocode textarea', async ({ page }) => {
      await expect(page.getByRole('textbox')).toBeVisible()
    })

    test('shows the Compile button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /compile/i })).toBeVisible()
    })

    test('textarea has no autocomplete or spellcheck', async ({ page }) => {
      const textarea = page.getByRole('textbox')
      await expect(textarea).toHaveAttribute('autocomplete', 'off')
      await expect(textarea).toHaveAttribute('spellcheck', 'false')
    })

    test('user can type pseudocode into the editor', async ({ page }) => {
      const textarea = page.getByRole('textbox')
      await textarea.fill('INPUT x')
      await expect(textarea).toHaveValue('INPUT x')
    })
  })

  test.describe('Bottom section — Error panel', () => {
    test('shows Output panel on the right', async ({ page }) => {
      await expect(page.getByText('Output', { exact: true })).toBeVisible()
    })

    test('shows idle prompt before compiling', async ({ page }) => {
      await expect(page.getByText(/write your pseudocode/i)).toBeVisible()
      await expect(page.getByText(/no errors found/i)).not.toBeVisible()
    })
  })

  test.describe('Compile — valid pseudocode', () => {
    test('shows no errors for fully declared valid pseudocode', async ({ page }) => {
      const code = [
        'DECLARE x : INTEGER',
        'INPUT x',
        'OUTPUT x',
      ].join('\n')
      await page.getByRole('textbox').fill(code)
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/no errors found/i)).toBeVisible()
    })

    test('accepts <- as assignment operator (ASCII alternative to ←)', async ({ page }) => {
      const code = [
        'DECLARE counter : INTEGER',
        'counter <- 0',
        'counter <- counter + 1',
        'OUTPUT counter',
      ].join('\n')
      await page.getByRole('textbox').fill(code)
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/no errors found/i)).toBeVisible()
    })
  })

  test.describe('Compile — lexer errors', () => {
    test('shows error for unknown character', async ({ page }) => {
      await page.getByRole('textbox').fill('DECLARE x : INTEGER\n@ invalid\nOUTPUT x')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/unexpected character/i)).toBeVisible()
    })

    test('shows line reference for lexer error', async ({ page }) => {
      await page.getByRole('textbox').fill('DECLARE x : INTEGER\n@ invalid\nOUTPUT x')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/line 2/i).first()).toBeVisible()
    })

    test('shows error count badge for multiple errors', async ({ page }) => {
      await page.getByRole('textbox').fill('@ bad\n# also bad')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/\d+ errors?/)).toBeVisible()
    })

    test('shows Syntax source tag for lexer errors', async ({ page }) => {
      await page.getByRole('textbox').fill('@ bad')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText('Syntax')).toBeVisible()
    })
  })

  test.describe('Compile — parser errors', () => {
    test('shows error for missing ENDIF', async ({ page }) => {
      const code = 'DECLARE x : INTEGER\nIF x > 0\n  THEN\n    OUTPUT x'
      await page.getByRole('textbox').fill(code)
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/ENDIF/i)).toBeVisible()
    })

    test('shows Structure source tag for parser errors', async ({ page }) => {
      const code = 'DECLARE x : INTEGER\nIF x > 0\n  THEN\n    OUTPUT x'
      await page.getByRole('textbox').fill(code)
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText('Structure')).toBeVisible()
    })
  })

  test.describe('New Question — state reset', () => {
    test('clicking New Question clears the editor', async ({ page }) => {
      await page.getByRole('textbox').fill('OUTPUT x')
      await page.getByRole('button', { name: /new question/i }).click()
      await expect(page.getByRole('textbox')).toHaveValue('')
    })

    test('clicking New Question resets output panel to idle after a compile with errors', async ({ page }) => {
      await page.getByRole('textbox').fill('OUTPUT undeclaredVar')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/no errors found/i)).not.toBeVisible()
      await page.getByRole('button', { name: /new question/i }).click()
      await expect(page.getByText(/write your pseudocode/i)).toBeVisible()
      await expect(page.getByText(/no errors found/i)).not.toBeVisible()
    })

    test('clicking New Question resets output panel to idle after a clean compile', async ({ page }) => {
      const code = 'DECLARE x : INTEGER\nINPUT x\nOUTPUT x'
      await page.getByRole('textbox').fill(code)
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/no errors found/i)).toBeVisible()
      await page.getByRole('button', { name: /new question/i }).click()
      await expect(page.getByText(/write your pseudocode/i)).toBeVisible()
      await expect(page.getByText(/no errors found/i)).not.toBeVisible()
    })
  })

  test.describe('Compile — validator errors', () => {
    test('shows error for undeclared variable', async ({ page }) => {
      await page.getByRole('textbox').fill('OUTPUT undeclaredVar')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText(/before declaration/i)).toBeVisible()
    })

    test('shows Semantic source tag for validator errors', async ({ page }) => {
      await page.getByRole('textbox').fill('OUTPUT undeclaredVar')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText('Semantic')).toBeVisible()
    })

    test('shows error for constant reassignment using ←', async ({ page }) => {
      await page.getByRole('textbox').fill('CONSTANT pi ← 3.14\npi ← 3')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText("Cannot assign to constant 'pi'")).toBeVisible()
    })

    test('shows error for constant reassignment using <-', async ({ page }) => {
      await page.getByRole('textbox').fill('CONSTANT pi <- 3.14\npi <- 3')
      await page.getByRole('button', { name: /compile/i }).click()
      await expect(page.getByText("Cannot assign to constant 'pi'")).toBeVisible()
    })
  })
})