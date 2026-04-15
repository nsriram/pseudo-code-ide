import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorPanel } from './ErrorPanel'
import type { CompileError } from '../compiler/index'

describe('ErrorPanel', () => {
  describe('idle state (hasCompiled=false)', () => {
    it('shows idle prompt before compilation', () => {
      render(<ErrorPanel errors={[]} hasCompiled={false} />)
      expect(screen.getByText(/write your pseudocode/i)).toBeInTheDocument()
    })

    it('does not show success message before compilation', () => {
      render(<ErrorPanel errors={[]} hasCompiled={false} />)
      expect(screen.queryByText(/no errors found/i)).not.toBeInTheDocument()
    })
  })

  describe('after compilation (hasCompiled=true)', () => {
    it('shows syntax-only success message when there are no errors', () => {
      render(<ErrorPanel errors={[]} hasCompiled={true} />)
      expect(screen.getByText(/no syntax errors found/i)).toBeInTheDocument()
    })

    it('shows "manually verify" hint when hasTestCases is false', () => {
      render(<ErrorPanel errors={[]} hasCompiled={true} hasTestCases={false} />)
      expect(screen.getByText(/manually verify/i)).toBeInTheDocument()
    })

    it('does not show manually verify hint when hasTestCases is true (tests run automatically)', () => {
      render(<ErrorPanel errors={[]} hasCompiled={true} hasTestCases={true} />)
      expect(screen.queryByText(/manually verify/i)).not.toBeInTheDocument()
    })

    it('does not show idle prompt after compilation', () => {
      render(<ErrorPanel errors={[]} hasCompiled={true} />)
      expect(screen.queryByText(/write your pseudocode/i)).not.toBeInTheDocument()
    })

    it('does not show error count badge when there are no errors', () => {
      render(<ErrorPanel errors={[]} hasCompiled={true} />)
      expect(screen.queryByText(/\d+ errors?/)).not.toBeInTheDocument()
    })

    it('renders each error with line, column, and message', () => {
      const errors: CompileError[] = [
        { line: 3, column: 5, message: 'Unexpected character: @', severity: 'error', source: 'lexer' },
        { line: 7, column: 1, message: 'Unterminated string literal', severity: 'error', source: 'lexer' },
      ]
      render(<ErrorPanel errors={errors} hasCompiled={true} />)
      expect(screen.getByText('Line 3, Col 5')).toBeInTheDocument()
      expect(screen.getByText('Unexpected character: @')).toBeInTheDocument()
      expect(screen.getByText('Line 7, Col 1')).toBeInTheDocument()
    })

    it('shows correct error count for a single error', () => {
      const errors: CompileError[] = [
        { line: 1, column: 1, message: 'Some error', severity: 'error', source: 'parser' },
      ]
      render(<ErrorPanel errors={errors} hasCompiled={true} />)
      expect(screen.getByText('1 error')).toBeInTheDocument()
    })

    it('shows correct error count for multiple errors', () => {
      const errors: CompileError[] = [
        { line: 1, column: 1, message: 'Error one', severity: 'error', source: 'parser' },
        { line: 2, column: 1, message: 'Error two', severity: 'error', source: 'validator' },
      ]
      render(<ErrorPanel errors={errors} hasCompiled={true} />)
      expect(screen.getByText('2 errors')).toBeInTheDocument()
    })

    it('shows source tag labels', () => {
      const errors: CompileError[] = [
        { line: 1, column: 1, message: 'bad token', severity: 'error', source: 'lexer' },
      ]
      render(<ErrorPanel errors={errors} hasCompiled={true} />)
      expect(screen.getByText('Syntax')).toBeInTheDocument()
    })
  })
})