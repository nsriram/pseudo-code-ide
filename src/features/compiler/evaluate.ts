import type { Program } from './ast'
import { interpret } from './interpreter'

export interface TestCase {
  inputs: string[]
  expected: string
  label?: string
}

export interface TestResult {
  label?: string
  inputs: string[]
  expected: string
  actual: string
  passed: boolean
  error: string | null
}

// ── Smart output matching ─────────────────────────────────────────────────────
// Strategy (tried in order, first match wins):
//   1. Normalised direct equality
//   2. Case-insensitive substring contains
//   3. Numeric: if expected is a number, find any number in output within tolerance

function normalise(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

function extractNumbers(s: string): number[] {
  const matches = s.match(/-?\d+(\.\d+)?/g) ?? []
  return matches.map(Number).filter((n) => !isNaN(n))
}

function withinTolerance(a: number, b: number): boolean {
  if (b === 0) return Math.abs(a) < 1e-9
  return Math.abs(a - b) / Math.abs(b) < 0.01  // 1% relative tolerance
}

function outputMatches(actual: string, expected: string): boolean {
  const normActual = normalise(actual)
  const normExpected = normalise(expected)

  // 1. Exact (normalised)
  if (normActual === normExpected) return true

  // 2. Case-insensitive substring (only for non-numeric expected values)
  const isPureNumber = normExpected !== '' && !isNaN(Number(normExpected))
  if (!isPureNumber && normActual.toLowerCase().includes(normExpected.toLowerCase())) return true

  // 3. Numeric
  const expNum = Number(normExpected)
  if (!isNaN(expNum)) {
    const actNums = extractNumbers(normActual)
    if (actNums.some((n) => withinTolerance(n, expNum))) return true
  }

  return false
}

// ── Public entry point ────────────────────────────────────────────────────────

export function evaluate(program: Program, testCases: TestCase[]): TestResult[] {
  return testCases.map((tc) => {
    const { output, error } = interpret(program, tc.inputs)
    const passed = error === null && outputMatches(output, tc.expected)
    return {
      label: tc.label,
      inputs: tc.inputs,
      expected: tc.expected,
      actual: output,
      passed,
      error,
    }
  })
}