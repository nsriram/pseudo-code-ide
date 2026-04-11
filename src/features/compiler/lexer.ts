export type TokenType =
  // Keywords
  | 'INPUT'
  | 'OUTPUT'
  | 'DECLARE'
  | 'CONSTANT'
  | 'IF'
  | 'THEN'
  | 'ELSE'
  | 'ENDIF'
  | 'CASE'
  | 'OF'
  | 'OTHERWISE'
  | 'ENDCASE'
  | 'FOR'
  | 'TO'
  | 'STEP'
  | 'NEXT'
  | 'WHILE'
  | 'DO'
  | 'ENDWHILE'
  | 'REPEAT'
  | 'UNTIL'
  | 'PROCEDURE'
  | 'ENDPROCEDURE'
  | 'CALL'
  | 'FUNCTION'
  | 'RETURNS'
  | 'RETURN'
  | 'ENDFUNCTION'
  | 'TYPE'
  | 'ENDTYPE'
  | 'ARRAY'
  | 'OF'
  | 'OPEN'
  | 'READFILE'
  | 'WRITEFILE'
  | 'CLOSEFILE'
  | 'EOF_FN'
  // Data types
  | 'BOOLEAN'
  | 'CHAR'
  | 'INTEGER'
  | 'REAL'
  | 'STRING'
  | 'DATE'
  // Built-in functions
  | 'LENGTH'
  | 'LEFT'
  | 'RIGHT'
  | 'MID'
  | 'ASC'
  // Literals
  | 'STRING_LITERAL'
  | 'INTEGER_LITERAL'
  | 'REAL_LITERAL'
  | 'BOOLEAN_LITERAL'
  // Operators
  | 'ASSIGN'        // ←
  | 'EQUALS'        // =
  | 'NOT_EQUALS'    // <>
  | 'LESS_THAN'     // <
  | 'GREATER_THAN'  // >
  | 'LESS_EQ'       // <=
  | 'GREATER_EQ'    // >=
  | 'PLUS'
  | 'MINUS'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'AMPERSAND'     // & (string concat)
  | 'COLON'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'DOT'
  | 'DASH'          // – (typographic minus in pseudocode)
  // Identifiers
  | 'IDENTIFIER'
  // Special
  | 'NEWLINE'
  | 'EOF'
  | 'UNKNOWN'

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

const KEYWORDS: Record<string, TokenType> = {
  INPUT: 'INPUT',
  OUTPUT: 'OUTPUT',
  DECLARE: 'DECLARE',
  CONSTANT: 'CONSTANT',
  IF: 'IF',
  THEN: 'THEN',
  ELSE: 'ELSE',
  ENDIF: 'ENDIF',
  CASE: 'CASE',
  OF: 'OF',
  OTHERWISE: 'OTHERWISE',
  ENDCASE: 'ENDCASE',
  FOR: 'FOR',
  TO: 'TO',
  STEP: 'STEP',
  NEXT: 'NEXT',
  WHILE: 'WHILE',
  DO: 'DO',
  ENDWHILE: 'ENDWHILE',
  REPEAT: 'REPEAT',
  UNTIL: 'UNTIL',
  PROCEDURE: 'PROCEDURE',
  ENDPROCEDURE: 'ENDPROCEDURE',
  CALL: 'CALL',
  FUNCTION: 'FUNCTION',
  RETURNS: 'RETURNS',
  RETURN: 'RETURN',
  ENDFUNCTION: 'ENDFUNCTION',
  TYPE: 'TYPE',
  ENDTYPE: 'ENDTYPE',
  ARRAY: 'ARRAY',
  OPEN: 'OPEN',
  READFILE: 'READFILE',
  WRITEFILE: 'WRITEFILE',
  CLOSEFILE: 'CLOSEFILE',
  EOF: 'EOF_FN',
  // Data types
  BOOLEAN: 'BOOLEAN',
  CHAR: 'CHAR',
  INTEGER: 'INTEGER',
  REAL: 'REAL',
  STRING: 'STRING',
  DATE: 'DATE',
  // Boolean literals
  TRUE: 'BOOLEAN_LITERAL',
  FALSE: 'BOOLEAN_LITERAL',
  // Built-in functions
  LENGTH: 'LENGTH',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  MID: 'MID',
  ASC: 'ASC',
}

export interface LexerError {
  line: number
  column: number
  message: string
}

export interface LexerResult {
  tokens: Token[]
  errors: LexerError[]
}

export function tokenize(source: string): LexerResult {
  const tokens: Token[] = []
  const errors: LexerError[] = []

  let pos = 0
  let line = 1
  let lineStart = 0

  function col() {
    return pos - lineStart + 1
  }

  function peek(offset = 0): string {
    return source[pos + offset] ?? ''
  }

  function advance(): string {
    return source[pos++]
  }

  function makeToken(type: TokenType, value: string, tokenLine: number, tokenCol: number): Token {
    return { type, value, line: tokenLine, column: tokenCol }
  }

  while (pos < source.length) {
    // Skip spaces and tabs (not newlines)
    if (peek() === ' ' || peek() === '\t') {
      advance()
      continue
    }

    // Newline
    if (peek() === '\n') {
      tokens.push(makeToken('NEWLINE', '\\n', line, col()))
      advance()
      line++
      lineStart = pos
      continue
    }

    // Carriage return (Windows line endings)
    if (peek() === '\r') {
      advance()
      continue
    }

    const tokenLine = line
    const tokenCol = col()

    // String literal
    if (peek() === '"') {
      advance()
      let str = ''
      while (pos < source.length && peek() !== '"' && peek() !== '\n') {
        str += advance()
      }
      if (peek() === '"') {
        advance()
        tokens.push(makeToken('STRING_LITERAL', str, tokenLine, tokenCol))
      } else {
        errors.push({ line: tokenLine, column: tokenCol, message: 'Unterminated string literal' })
        tokens.push(makeToken('STRING_LITERAL', str, tokenLine, tokenCol))
      }
      continue
    }

    // Assignment arrow ← (UTF-8: U+2190)
    if (peek() === '←') {
      advance()
      tokens.push(makeToken('ASSIGN', '←', tokenLine, tokenCol))
      continue
    }

    // Typographic dash – (U+2013, used in pseudocode for subtraction)
    if (peek() === '–') {
      advance()
      tokens.push(makeToken('DASH', '–', tokenLine, tokenCol))
      continue
    }

    // Two-char operators
    if (peek() === '<' && peek(1) === '>') {
      advance(); advance()
      tokens.push(makeToken('NOT_EQUALS', '<>', tokenLine, tokenCol))
      continue
    }
    if (peek() === '<' && peek(1) === '=') {
      advance(); advance()
      tokens.push(makeToken('LESS_EQ', '<=', tokenLine, tokenCol))
      continue
    }
    if (peek() === '>' && peek(1) === '=') {
      advance(); advance()
      tokens.push(makeToken('GREATER_EQ', '>=', tokenLine, tokenCol))
      continue
    }

    // Single-char operators / punctuation
    const singleChar: Record<string, TokenType> = {
      '=': 'EQUALS',
      '<': 'LESS_THAN',
      '>': 'GREATER_THAN',
      '+': 'PLUS',
      '-': 'MINUS',
      '*': 'MULTIPLY',
      '/': 'DIVIDE',
      '&': 'AMPERSAND',
      ':': 'COLON',
      ',': 'COMMA',
      '(': 'LPAREN',
      ')': 'RPAREN',
      '[': 'LBRACKET',
      ']': 'RBRACKET',
      '.': 'DOT',
    }
    if (peek() in singleChar) {
      const ch = advance()
      tokens.push(makeToken(singleChar[ch], ch, tokenLine, tokenCol))
      continue
    }

    // Number literal
    if (peek() >= '0' && peek() <= '9') {
      let num = ''
      while (pos < source.length && peek() >= '0' && peek() <= '9') {
        num += advance()
      }
      if (peek() === '.') {
        num += advance()
        while (pos < source.length && peek() >= '0' && peek() <= '9') {
          num += advance()
        }
        tokens.push(makeToken('REAL_LITERAL', num, tokenLine, tokenCol))
      } else {
        tokens.push(makeToken('INTEGER_LITERAL', num, tokenLine, tokenCol))
      }
      continue
    }

    // Identifier or keyword
    if ((peek() >= 'A' && peek() <= 'Z') || (peek() >= 'a' && peek() <= 'z') || peek() === '_') {
      let word = ''
      while (
        pos < source.length &&
        ((peek() >= 'A' && peek() <= 'Z') ||
          (peek() >= 'a' && peek() <= 'z') ||
          (peek() >= '0' && peek() <= '9') ||
          peek() === '_')
      ) {
        word += advance()
      }
      const upper = word.toUpperCase()
      const kwType = KEYWORDS[upper]
      tokens.push(makeToken(kwType ?? 'IDENTIFIER', word, tokenLine, tokenCol))
      continue
    }

    // Unknown character
    const ch = advance()
    errors.push({ line: tokenLine, column: tokenCol, message: `Unexpected character: '${ch}'` })
    tokens.push(makeToken('UNKNOWN', ch, tokenLine, tokenCol))
  }

  tokens.push(makeToken('EOF', '', line, col()))
  return { tokens, errors }
}