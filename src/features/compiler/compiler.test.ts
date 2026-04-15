import { describe, it, expect } from 'vitest'
import { compile } from './index'

describe('compile() — full pipeline', () => {
  it('returns no errors for valid pseudocode', () => {
    const { errors } = compile(
      'DECLARE x : INTEGER\nINPUT x\nOUTPUT x'
    )
    expect(errors).toHaveLength(0)
  })

  it('returns lexer error for unknown character', () => {
    const { errors } = compile('INPUT x\n@bad')
    const lexerErr = errors.find((e) => e.source === 'lexer')
    expect(lexerErr).toBeDefined()
    expect(lexerErr?.message).toMatch(/unexpected character/i)
  })

  it('returns parser error for missing ENDIF', () => {
    const { errors } = compile('DECLARE x : INTEGER\nIF x > 0\n  THEN\n    OUTPUT x')
    const parserErr = errors.find((e) => e.source === 'parser')
    expect(parserErr).toBeDefined()
    expect(parserErr?.message).toMatch(/ENDIF/i)
  })

  it('returns validator error for undeclared variable', () => {
    const { errors } = compile('OUTPUT undeclaredVar')
    const valErr = errors.find((e) => e.source === 'validator')
    expect(valErr).toBeDefined()
    expect(valErr?.message).toMatch(/before declaration/i)
  })

  it('returns validator error for constant reassignment', () => {
    const { errors } = compile('CONSTANT pi ← 3.14\npi ← 3')
    const valErr = errors.find((e) => e.source === 'validator')
    expect(valErr?.message).toMatch(/constant/i)
  })

  it('skips validation when parse errors exist', () => {
    const { errors } = compile('IF x > 0\n  THEN\n    OUTPUT x')
    // Should have parser errors but not validator errors (AST is incomplete)
    expect(errors.every((e) => e.source !== 'validator')).toBe(true)
  })

  it('returns an error when code is empty', () => {
    const { errors } = compile('')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/no code entered/i)
  })

  it('returns an error when code is whitespace only', () => {
    const { errors } = compile('   \n  \t  ')
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/no code entered/i)
  })

  it('all errors have required fields', () => {
    const { errors } = compile('@bad\n#also bad')
    expect(errors.length).toBeGreaterThan(0)
    for (const e of errors) {
      expect(e).toHaveProperty('line')
      expect(e).toHaveProperty('column')
      expect(e).toHaveProperty('message')
      expect(e).toHaveProperty('severity')
      expect(e).toHaveProperty('source')
    }
  })
})