import { tokenize } from './lexer'
import { parse } from './parser'
import { validate } from './validator'

export type ErrorSeverity = 'error' | 'warning'

export interface CompileError {
  line: number
  column: number
  message: string
  severity: ErrorSeverity
  source: 'lexer' | 'parser' | 'validator'
}

export interface CompileResult {
  errors: CompileError[]
  program: import('./ast').Program | null
}

export function compile(source: string): CompileResult {
  if (source.trim() === '') {
    return {
      program: null,
      errors: [
        {
          line: 1,
          column: 1,
          message: 'No code entered. Write your pseudocode and click Compile.',
          severity: 'error',
          source: 'validator',
        },
      ],
    }
  }

  const errors: CompileError[] = []

  const { tokens, errors: lexErrors } = tokenize(source)
  for (const e of lexErrors) {
    errors.push({ ...e, severity: 'error', source: 'lexer' })
  }

  const { program, errors: parseErrors } = parse(tokens)
  for (const e of parseErrors) {
    errors.push({ ...e, severity: 'error', source: 'parser' })
  }

  // Only validate if no parse errors — AST may be incomplete otherwise
  if (errors.length === 0) {
    const validationErrors = validate(program)
    for (const e of validationErrors) {
      errors.push({ ...e, severity: 'error', source: 'validator' })
    }
  }

  return { errors, program: errors.length === 0 ? program : null }
}
