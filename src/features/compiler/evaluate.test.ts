import { describe, it, expect } from 'vitest'
import { tokenize } from './lexer'
import { parse } from './parser'
import { evaluate } from './evaluate'
import type { TestCase } from './evaluate'

function runEval(source: string, testCases: TestCase[]) {
  const { tokens } = tokenize(source)
  const { program } = parse(tokens)
  return evaluate(program, testCases)
}

describe('evaluate', () => {
  describe('exact match', () => {
    it('passes when output exactly matches expected', () => {
      const results = runEval('OUTPUT 42', [{ inputs: [], expected: '42' }])
      expect(results[0].passed).toBe(true)
    })

    it('fails when output does not match expected', () => {
      const results = runEval('OUTPUT 42', [{ inputs: [], expected: '99' }])
      expect(results[0].passed).toBe(false)
    })
  })

  describe('substring match (case-insensitive)', () => {
    it('passes when output contains expected as substring', () => {
      const results = runEval('OUTPUT "The sum is 8"', [{ inputs: [], expected: '8' }])
      expect(results[0].passed).toBe(true)
    })

    it('passes case-insensitively', () => {
      const results = runEval('OUTPUT "Pass"', [{ inputs: [], expected: 'pass' }])
      expect(results[0].passed).toBe(true)
    })
  })

  describe('numeric tolerance match', () => {
    it('passes when output contains a number within 1% of expected', () => {
      // 1.60934 matches expected "1.60934"
      const results = runEval('OUTPUT 1.60934', [{ inputs: [], expected: '1.60934' }])
      expect(results[0].passed).toBe(true)
    })

    it('passes when a calculation is within tolerance', () => {
      // 98.6 degrees Fahrenheit, expected "98.6"
      const src = 'DECLARE c : REAL\nc ← 37\nOUTPUT (c * 9 / 5) + 32'
      const results = runEval(src, [{ inputs: [], expected: '98.6' }])
      expect(results[0].passed).toBe(true)
    })
  })

  describe('runtime errors', () => {
    it('marks test as failed when a runtime error occurs', () => {
      const results = runEval('DECLARE x : INTEGER\nINPUT x\nOUTPUT x', [{ inputs: [], expected: '1' }])
      expect(results[0].passed).toBe(false)
      expect(results[0].error).toMatch(/inputs/i)
    })
  })

  describe('non-numeric expected string', () => {
    it('passes via substring match when expected is a word like "Pass"', () => {
      const results = runEval('OUTPUT "Pass"', [{ inputs: [], expected: 'Pass' }])
      expect(results[0].passed).toBe(true)
    })

    it('fails when output does not contain expected word', () => {
      const results = runEval('OUTPUT "Fail"', [{ inputs: [], expected: 'Pass' }])
      expect(results[0].passed).toBe(false)
    })
  })

  describe('numeric tolerance — zero expected', () => {
    it('passes when output is also 0', () => {
      const results = runEval('OUTPUT 0', [{ inputs: [], expected: '0' }])
      expect(results[0].passed).toBe(true)
    })
  })

  describe('multiple test cases', () => {
    it('evaluates all test cases independently', () => {
      const src = 'DECLARE a : INTEGER\nDECLARE b : INTEGER\nINPUT a\nINPUT b\nOUTPUT a + b'
      const testCases: TestCase[] = [
        { inputs: ['3', '5'], expected: '8', label: '3+5=8' },
        { inputs: ['10', '0'], expected: '10', label: '10+0=10' },
      ]
      const results = runEval(src, testCases)
      expect(results).toHaveLength(2)
      expect(results[0].passed).toBe(true)
      expect(results[1].passed).toBe(true)
    })

    it('records label, inputs, expected, and actual in results', () => {
      const results = runEval('OUTPUT 7', [{ inputs: [], expected: '7', label: 'outputs 7' }])
      expect(results[0].label).toBe('outputs 7')
      expect(results[0].inputs).toEqual([])
      expect(results[0].expected).toBe('7')
      expect(results[0].actual).toBe('7')
    })
  })
})