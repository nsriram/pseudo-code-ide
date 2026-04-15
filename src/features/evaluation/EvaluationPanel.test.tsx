import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EvaluationPanel } from './EvaluationPanel'
import type { TestResult } from '../compiler/evaluate'

const passingResult: TestResult = {
  label: '3 + 5 = 8',
  inputs: ['3', '5'],
  expected: '8',
  actual: '8',
  passed: true,
  error: null,
}

const failingResult: TestResult = {
  label: 'wrong answer',
  inputs: ['1', '2'],
  expected: '5',
  actual: '3',
  passed: false,
  error: null,
}

const errorResult: TestResult = {
  inputs: [],
  expected: '1',
  actual: '',
  passed: false,
  error: 'Program requested more inputs than were provided',
}

describe('EvaluationPanel', () => {
  it('shows "Tests" heading', () => {
    render(<EvaluationPanel results={[passingResult]} />)
    expect(screen.getByText('Tests')).toBeVisible()
  })

  it('shows passed/total badge', () => {
    render(<EvaluationPanel results={[passingResult, failingResult]} />)
    expect(screen.getByText('1/2 passed')).toBeVisible()
  })

  it('shows all-passed badge when all pass', () => {
    render(<EvaluationPanel results={[passingResult]} />)
    expect(screen.getByText('1/1 passed')).toBeVisible()
  })

  it('renders a row for each result', () => {
    render(<EvaluationPanel results={[passingResult, failingResult]} />)
    expect(screen.getByText('3 + 5 = 8')).toBeVisible()
    expect(screen.getByText('wrong answer')).toBeVisible()
  })

  it('shows ✓ for passing result', () => {
    render(<EvaluationPanel results={[passingResult]} />)
    expect(screen.getByText('✓')).toBeVisible()
  })

  it('shows ✗ for failing result', () => {
    render(<EvaluationPanel results={[failingResult]} />)
    expect(screen.getByText('✗')).toBeVisible()
  })

  it('shows runtime error message for error result', () => {
    render(<EvaluationPanel results={[errorResult]} />)
    expect(screen.getByText(/runtime error/i)).toBeVisible()
  })

  it('uses "Test N" as label when label is not provided', () => {
    render(<EvaluationPanel results={[errorResult]} />)
    expect(screen.getByText('Test 1')).toBeVisible()
  })

  it('shows input and output detail for passing result', () => {
    render(<EvaluationPanel results={[passingResult]} />)
    expect(screen.getByText(/Inputs: \[3, 5\]/)).toBeVisible()
  })

  it('shows expected vs actual for failing result', () => {
    render(<EvaluationPanel results={[failingResult]} />)
    expect(screen.getByText(/Expected: "5"/)).toBeVisible()
  })
})