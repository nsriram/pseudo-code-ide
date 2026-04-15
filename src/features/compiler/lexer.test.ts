import { describe, it, expect } from 'vitest'
import { tokenize } from './lexer'

describe('lexer', () => {
  describe('keywords', () => {
    it('tokenizes INPUT', () => {
      const { tokens } = tokenize('INPUT Name')
      expect(tokens[0]).toMatchObject({ type: 'INPUT', value: 'INPUT' })
    })

    it('tokenizes OUTPUT', () => {
      const { tokens } = tokenize('OUTPUT "Hello"')
      expect(tokens[0]).toMatchObject({ type: 'OUTPUT' })
    })

    it('tokenizes DECLARE', () => {
      const { tokens } = tokenize('DECLARE x : INTEGER')
      expect(tokens[0]).toMatchObject({ type: 'DECLARE' })
    })

    it('tokenizes CONSTANT', () => {
      const { tokens } = tokenize('CONSTANT pi ← 3.14')
      expect(tokens[0]).toMatchObject({ type: 'CONSTANT' })
    })

    it('tokenizes IF THEN ELSE ENDIF', () => {
      const { tokens } = tokenize('IF x > 0\n  THEN\n    OUTPUT x\n  ELSE\n    OUTPUT 0\nENDIF')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('IF')
      expect(types).toContain('THEN')
      expect(types).toContain('ELSE')
      expect(types).toContain('ENDIF')
    })

    it('tokenizes CASE OF OTHERWISE ENDCASE', () => {
      const { tokens } = tokenize('CASE OF x\n  "A": OUTPUT 1\n  OTHERWISE: OUTPUT 0\nENDCASE')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('CASE')
      expect(types).toContain('OF')
      expect(types).toContain('OTHERWISE')
      expect(types).toContain('ENDCASE')
    })

    it('tokenizes FOR TO STEP NEXT', () => {
      const { tokens } = tokenize('FOR i ← 1 TO 10 STEP 2\nNEXT i')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('FOR')
      expect(types).toContain('TO')
      expect(types).toContain('STEP')
      expect(types).toContain('NEXT')
    })

    it('tokenizes WHILE DO ENDWHILE', () => {
      const { tokens } = tokenize('WHILE x > 0 DO\nENDWHILE')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('WHILE')
      expect(types).toContain('DO')
      expect(types).toContain('ENDWHILE')
    })

    it('tokenizes REPEAT UNTIL', () => {
      const { tokens } = tokenize('REPEAT\n  INPUT x\nUNTIL x > 0')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('REPEAT')
      expect(types).toContain('UNTIL')
    })

    it('tokenizes PROCEDURE ENDPROCEDURE CALL', () => {
      const { tokens } = tokenize('PROCEDURE Greet\nENDPROCEDURE\nCALL Greet')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('PROCEDURE')
      expect(types).toContain('ENDPROCEDURE')
      expect(types).toContain('CALL')
    })

    it('tokenizes FUNCTION RETURNS RETURN ENDFUNCTION', () => {
      const { tokens } = tokenize('FUNCTION Add(a:INTEGER) RETURNS INTEGER\n  RETURN a\nENDFUNCTION')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('FUNCTION')
      expect(types).toContain('RETURNS')
      expect(types).toContain('RETURN')
      expect(types).toContain('ENDFUNCTION')
    })

    it('tokenizes ARRAY OF TYPE ENDTYPE', () => {
      const { tokens } = tokenize('DECLARE myList : ARRAY[0:8] OF INTEGER\nTYPE\nENDTYPE')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('ARRAY')
      expect(types).toContain('OF')
      expect(types).toContain('TYPE')
      expect(types).toContain('ENDTYPE')
    })

    it('tokenizes file keywords', () => {
      const { tokens } = tokenize('OPEN f FOR READ\nREADFILE f, x\nWRITEFILE f, x\nCLOSEFILE f')
      const types = tokens.map((t) => t.type)
      expect(types).toContain('OPEN')
      expect(types).toContain('READFILE')
      expect(types).toContain('WRITEFILE')
      expect(types).toContain('CLOSEFILE')
    })

    it('tokenizes EOF as EOF_FN to distinguish from end-of-input', () => {
      const { tokens } = tokenize('EOF(f)')
      expect(tokens[0]).toMatchObject({ type: 'EOF_FN', value: 'EOF' })
    })
  })

  describe('data types', () => {
    it.each(['BOOLEAN', 'CHAR', 'INTEGER', 'REAL', 'STRING', 'DATE'])(
      'tokenizes %s as its own type',
      (dtype) => {
        const { tokens } = tokenize(dtype)
        expect(tokens[0].type).toBe(dtype)
      }
    )
  })

  describe('built-in functions', () => {
    it.each(['LENGTH', 'LEFT', 'RIGHT', 'MID', 'ASC'])('tokenizes %s', (fn) => {
      const { tokens } = tokenize(fn)
      expect(tokens[0].type).toBe(fn)
    })
  })

  describe('boolean literals', () => {
    it('tokenizes TRUE and FALSE as BOOLEAN_LITERAL', () => {
      const { tokens: t1 } = tokenize('TRUE')
      const { tokens: t2 } = tokenize('FALSE')
      expect(t1[0]).toMatchObject({ type: 'BOOLEAN_LITERAL', value: 'TRUE' })
      expect(t2[0]).toMatchObject({ type: 'BOOLEAN_LITERAL', value: 'FALSE' })
    })
  })

  describe('literals', () => {
    it('tokenizes integer literals', () => {
      const { tokens } = tokenize('42')
      expect(tokens[0]).toMatchObject({ type: 'INTEGER_LITERAL', value: '42' })
    })

    it('tokenizes real literals', () => {
      const { tokens } = tokenize('3.14')
      expect(tokens[0]).toMatchObject({ type: 'REAL_LITERAL', value: '3.14' })
    })

    it('tokenizes string literals', () => {
      const { tokens } = tokenize('"Hello World"')
      expect(tokens[0]).toMatchObject({ type: 'STRING_LITERAL', value: 'Hello World' })
    })

    it('tokenizes empty string literal', () => {
      const { tokens } = tokenize('""')
      expect(tokens[0]).toMatchObject({ type: 'STRING_LITERAL', value: '' })
    })
  })

  describe('operators', () => {
    it('tokenizes assignment arrow ←', () => {
      const { tokens } = tokenize('x ← 1')
      expect(tokens[1]).toMatchObject({ type: 'ASSIGN', value: '←' })
    })

    it('tokenizes <- as ASSIGN', () => {
      const { tokens } = tokenize('x <- 1')
      expect(tokens[1]).toMatchObject({ type: 'ASSIGN', value: '<-' })
    })

    it('<- and ← produce the same ASSIGN token type', () => {
      const { tokens: t1 } = tokenize('x <- 1')
      const { tokens: t2 } = tokenize('x ← 1')
      expect(t1[1].type).toBe(t2[1].type)
    })

    it('<- does not interfere with <> (NOT_EQUALS)', () => {
      const { tokens } = tokenize('x <> y')
      expect(tokens[1]).toMatchObject({ type: 'NOT_EQUALS', value: '<>' })
    })

    it('<- does not interfere with <= (LESS_EQ)', () => {
      const { tokens } = tokenize('x <= y')
      expect(tokens[1]).toMatchObject({ type: 'LESS_EQ', value: '<=' })
    })

    it('tokenizes a full assignment statement using <-', () => {
      const { tokens, errors } = tokenize('Counter <- Counter + 1')
      expect(errors).toHaveLength(0)
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'Counter' })
      expect(tokens[1]).toMatchObject({ type: 'ASSIGN', value: '<-' })
      expect(tokens[2]).toMatchObject({ type: 'IDENTIFIER', value: 'Counter' })
    })

    it('tokenizes typographic dash –', () => {
      const { tokens } = tokenize('x – 1')
      expect(tokens[1]).toMatchObject({ type: 'DASH' })
    })

    it('tokenizes <> as NOT_EQUALS', () => {
      const { tokens } = tokenize('x <> y')
      expect(tokens[1]).toMatchObject({ type: 'NOT_EQUALS', value: '<>' })
    })

    it('tokenizes <= as LESS_EQ', () => {
      const { tokens } = tokenize('x <= y')
      expect(tokens[1]).toMatchObject({ type: 'LESS_EQ' })
    })

    it('tokenizes >= as GREATER_EQ', () => {
      const { tokens } = tokenize('x >= y')
      expect(tokens[1]).toMatchObject({ type: 'GREATER_EQ' })
    })

    it.each([
      ['=', 'EQUALS'],
      ['<', 'LESS_THAN'],
      ['>', 'GREATER_THAN'],
      ['+', 'PLUS'],
      ['-', 'MINUS'],
      ['*', 'MULTIPLY'],
      ['/', 'DIVIDE'],
      ['&', 'AMPERSAND'],
      [':', 'COLON'],
      [',', 'COMMA'],
      ['(', 'LPAREN'],
      [')', 'RPAREN'],
      ['[', 'LBRACKET'],
      [']', 'RBRACKET'],
      ['.', 'DOT'],
    ])('tokenizes %s as %s', (ch, type) => {
      const { tokens } = tokenize(ch)
      expect(tokens[0]).toMatchObject({ type })
    })
  })

  describe('identifiers', () => {
    it('tokenizes identifiers', () => {
      const { tokens } = tokenize('myVar')
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'myVar' })
    })

    it('is case-sensitive for identifiers (not keywords)', () => {
      const { tokens } = tokenize('myInput')
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'myInput' })
    })

    it('tokenizes identifiers with underscores', () => {
      const { tokens } = tokenize('my_var')
      expect(tokens[0]).toMatchObject({ type: 'IDENTIFIER', value: 'my_var' })
    })
  })

  describe('line and column tracking', () => {
    it('tracks line numbers across newlines', () => {
      const { tokens } = tokenize('INPUT x\nOUTPUT x')
      const output = tokens.find((t) => t.type === 'OUTPUT')
      expect(output?.line).toBe(2)
    })

    it('tracks column numbers', () => {
      const { tokens } = tokenize('INPUT x')
      expect(tokens[0]).toMatchObject({ line: 1, column: 1 })
      expect(tokens[1]).toMatchObject({ line: 1, column: 7 })
    })
  })

  describe('errors', () => {
    it('reports unterminated string literal', () => {
      const { errors } = tokenize('"unterminated')
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toMatch(/unterminated string/i)
    })

    it('reports unknown character', () => {
      const { errors } = tokenize('@')
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toMatch(/unexpected character/i)
    })

    it('returns no errors for valid pseudocode', () => {
      const { errors } = tokenize('INPUT x\nx ← x + 1\nOUTPUT x')
      expect(errors).toHaveLength(0)
    })
  })

  describe('newlines and EOF', () => {
    it('emits NEWLINE tokens', () => {
      const { tokens } = tokenize('INPUT x\nOUTPUT x')
      expect(tokens.some((t) => t.type === 'NEWLINE')).toBe(true)
    })

    it('always ends with EOF token', () => {
      const { tokens } = tokenize('INPUT x')
      expect(tokens[tokens.length - 1].type).toBe('EOF')
    })
  })
})

describe('single-line comments (//)', () => {
  it('ignores comment at end of line', () => {
    const { tokens } = tokenize('OUTPUT 1 // comment\nOUTPUT 2')
    const meaningful = tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF')
    expect(meaningful.map(t => t.type)).toEqual(['OUTPUT', 'INTEGER_LITERAL', 'OUTPUT', 'INTEGER_LITERAL'])
  })
  it('ignores a comment-only line without errors', () => {
    const { errors } = tokenize('// just a comment')
    expect(errors).toHaveLength(0)
  })
  it('does not treat // inside a string as a comment', () => {
    const { tokens } = tokenize('OUTPUT "https://x"')
    expect(tokens.find(t => t.type === 'STRING_LITERAL')?.value).toBe('https://x')
  })
})

describe('CHAR literals', () => {
  it("tokenises 'A' as STRING_LITERAL 'A'", () => {
    const { tokens } = tokenize("OUTPUT 'A'")
    expect(tokens.find(t => t.type === 'STRING_LITERAL')?.value).toBe('A')
  })
  it('reports error for unterminated char literal', () => {
    const { errors } = tokenize("c ← 'A")
    expect(errors[0]?.message).toMatch(/unterminated character literal/i)
  })
})

describe('power operator (^)', () => {
  it('tokenises ^ as POWER', () => {
    const { tokens } = tokenize('2 ^ 3')
    expect(tokens.find(t => t.type === 'POWER')).toBeDefined()
  })
})