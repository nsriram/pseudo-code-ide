import type { Token, TokenType } from './lexer'
import type {
  Program, Statement, Expression, DataType,
  BinaryOperator,
  PrimitiveType, ArrayType, NamedType,
  Literal, Identifier, BinaryExpr, UnaryExpr, FunctionCall, ArrayAccess, RecordAccess,
  InputStatement, OutputStatement, AssignStatement,
  IfStatement, CaseStatement, CaseClause,
  ForStatement, WhileStatement, RepeatStatement,
  DeclareStatement, ConstantStatement, TypeDecl, FieldDecl,
  ProcedureDecl, FunctionDecl, Parameter,
  CallStatement, ReturnStatement,
  OpenFileStatement, ReadFileStatement, WriteFileStatement, CloseFileStatement,
} from './ast'

export interface ParseError {
  line: number
  column: number
  message: string
}

export interface ParseResult {
  program: Program
  errors: ParseError[]
}

const PRIMITIVE_TYPES = new Set(['BOOLEAN', 'CHAR', 'INTEGER', 'REAL', 'STRING', 'DATE'])
const FILE_MODES = new Set(['READ', 'WRITE', 'APPEND'])

export function parse(tokens: Token[]): ParseResult {
  const errors: ParseError[] = []
  // Filter out NEWLINE tokens for the parser; we use line info from each token directly
  const toks = tokens.filter((t) => t.type !== 'NEWLINE' && t.type !== 'EOF')
  let pos = 0

  function peek(offset = 0): Token {
    return toks[pos + offset] ?? { type: 'EOF', value: '', line: 0, column: 0 }
  }

  function advance(): Token {
    // eslint-disable-next-line security/detect-object-injection -- pos is a compiler-controlled numeric index, not user input
    const t = toks[pos]
    pos++
    return t
  }

  function check(type: TokenType): boolean {
    return peek().type === type
  }

  function match(...types: TokenType[]): Token | null {
    for (const t of types) {
      if (check(t)) return advance()
    }
    return null
  }

  function expect(type: TokenType, message?: string): Token {
    if (check(type)) return advance()
    const tok = peek()
    errors.push({
      line: tok.line,
      column: tok.column,
      message: message ?? `Expected ${type} but got '${tok.value || tok.type}'`,
    })
    // Return a synthetic token so parsing can continue
    return { type, value: '', line: tok.line, column: tok.column }
  }

  function error(msg: string, tok = peek()): void {
    errors.push({ line: tok.line, column: tok.column, message: msg })
  }

  // ── Expressions ────────────────────────────────────────────────────────────

  function parseExpression(): Expression {
    return parseLogicalOr()
  }

  function parseLogicalOr(): Expression {
    let left = parseLogicalAnd()
    while (check('OR')) {
      const op = advance()
      const right = parseLogicalAnd()
      left = { kind: 'BinaryExpr', operator: 'OR', left, right, line: op.line, column: op.column } as BinaryExpr
    }
    return left
  }

  function parseLogicalAnd(): Expression {
    let left = parseComparison()
    while (check('AND')) {
      const op = advance()
      const right = parseComparison()
      left = { kind: 'BinaryExpr', operator: 'AND', left, right, line: op.line, column: op.column } as BinaryExpr
    }
    return left
  }

  function parseComparison(): Expression {
    let left = parseConcat()
    while (
      check('EQUALS') || check('NOT_EQUALS') ||
      check('LESS_THAN') || check('GREATER_THAN') ||
      check('LESS_EQ') || check('GREATER_EQ')
    ) {
      const op = advance()
      const right = parseConcat()
      left = { kind: 'BinaryExpr', operator: op.value, left, right, line: op.line, column: op.column } as BinaryExpr
    }
    return left
  }

  function parseConcat(): Expression {
    let left = parseAddSub()
    while (check('AMPERSAND')) {
      const op = advance()
      const right = parseAddSub()
      left = { kind: 'BinaryExpr', operator: '&', left, right, line: op.line, column: op.column } as BinaryExpr
    }
    return left
  }

  function parseAddSub(): Expression {
    let left = parseMulDiv()
    while (check('PLUS') || check('MINUS') || check('DASH')) {
      const op = advance()
      const right = parseMulDiv()
      left = { kind: 'BinaryExpr', operator: op.value, left, right, line: op.line, column: op.column } as BinaryExpr
    }
    return left
  }

  function parseMulDiv(): Expression {
    let left = parseUnary()
    while (check('MULTIPLY') || check('DIVIDE') || check('DIV') || check('MOD')) {
      const op = advance()
      const operator = op.type === 'DIVIDE' ? '/' : op.value.toUpperCase()
      const right = parseUnary()
      left = { kind: 'BinaryExpr', operator, left, right, line: op.line, column: op.column } as BinaryExpr
    }
    return left
  }

  function parseUnary(): Expression {
    if (check('MINUS') || check('DASH')) {
      const op = advance()
      const operand = parseUnary()
      return { kind: 'UnaryExpr', operator: '-', operand, line: op.line, column: op.column } as UnaryExpr
    }
    if (check('NOT')) {
      const op = advance()
      const operand = parseUnary()
      return { kind: 'UnaryExpr', operator: 'NOT', operand, line: op.line, column: op.column } as UnaryExpr
    }
    return parsePower()
  }

  function parsePower(): Expression {
    const base = parsePostfix()
    if (check('POWER')) {
      const op = advance()
      const exp = parseUnary() // right-associative
      return { kind: 'BinaryExpr', operator: '^' as BinaryOperator, left: base, right: exp, line: op.line, column: op.column } as BinaryExpr
    }
    return base
  }

  function parsePostfix(): Expression {
    let expr = parsePrimary()

    // Record access: Identifier.field
    while (check('DOT')) {
      advance()
      const field = expect('IDENTIFIER', 'Expected field name after "."')
      if (expr.kind === 'Identifier') {
        expr = { kind: 'RecordAccess', record: (expr as Identifier).name, field: field.value, line: field.line, column: field.column } as RecordAccess
      }
    }

    return expr
  }

  function parsePrimary(): Expression {
    const tok = peek()

    // Parenthesised expression
    if (match('LPAREN')) {
      const expr = parseExpression()
      expect('RPAREN', 'Expected closing ")"')
      return expr
    }

    // Literals
    if (check('INTEGER_LITERAL')) {
      advance()
      return { kind: 'Literal', valueType: 'INTEGER', value: tok.value, line: tok.line, column: tok.column } as Literal
    }
    if (check('REAL_LITERAL')) {
      advance()
      return { kind: 'Literal', valueType: 'REAL', value: tok.value, line: tok.line, column: tok.column } as Literal
    }
    if (check('STRING_LITERAL')) {
      advance()
      return { kind: 'Literal', valueType: 'STRING', value: tok.value, line: tok.line, column: tok.column } as Literal
    }
    if (check('BOOLEAN_LITERAL')) {
      advance()
      return { kind: 'Literal', valueType: 'BOOLEAN', value: tok.value.toUpperCase(), line: tok.line, column: tok.column } as Literal
    }

    // Built-in / user-defined function call or identifier
    if (check('IDENTIFIER') || check('LENGTH') || check('LEFT') || check('RIGHT') || check('MID') || check('ASC') || check('EOF_FN')) {
      const nameTok = advance()
      // Array access: name[...]
      if (check('LBRACKET')) {
        advance()
        const indices: Expression[] = [parseExpression()]
        while (match('COMMA')) indices.push(parseExpression())
        expect('RBRACKET', 'Expected "]" after array index')
        return { kind: 'ArrayAccess', name: nameTok.value, indices, line: nameTok.line, column: nameTok.column } as ArrayAccess
      }
      // Function call: name(...)
      if (check('LPAREN')) {
        advance()
        const args: Expression[] = []
        if (!check('RPAREN')) {
          args.push(parseExpression())
          while (match('COMMA')) args.push(parseExpression())
        }
        expect('RPAREN', 'Expected ")" after arguments')
        return { kind: 'FunctionCall', name: nameTok.value, args, line: nameTok.line, column: nameTok.column } as FunctionCall
      }
      return { kind: 'Identifier', name: nameTok.value, line: nameTok.line, column: nameTok.column } as Identifier
    }

    error(`Unexpected token '${tok.value || tok.type}' in expression`)
    advance()
    return { kind: 'Literal', valueType: 'INTEGER', value: '0', line: tok.line, column: tok.column } as Literal
  }

  // ── Data Types ─────────────────────────────────────────────────────────────

  function parseDataType(): DataType {
    const tok = peek()

    if (check('ARRAY')) {
      advance()
      expect('LBRACKET', 'Expected "[" after ARRAY')
      const bounds: { lower: Expression; upper: Expression }[] = []
      const lower0 = parseExpression()
      expect('COLON', 'Expected ":" in array bounds')
      const upper0 = parseExpression()
      bounds.push({ lower: lower0, upper: upper0 })
      while (match('COMMA')) {
        const lo = parseExpression()
        expect('COLON', 'Expected ":" in array bounds')
        const hi = parseExpression()
        bounds.push({ lower: lo, upper: hi })
      }
      expect('RBRACKET', 'Expected "]" after array bounds')
      expect('OF', 'Expected OF after array bounds')
      const elementType = parseDataType() as PrimitiveType | NamedType
      return { kind: 'ArrayType', bounds, elementType } as ArrayType
    }

    if (PRIMITIVE_TYPES.has(tok.value.toUpperCase())) {
      advance()
      return { kind: 'PrimitiveType', name: tok.value.toUpperCase() as PrimitiveType['name'] } as PrimitiveType
    }

    if (check('IDENTIFIER')) {
      advance()
      return { kind: 'NamedType', name: tok.value } as NamedType
    }

    error(`Expected data type but got '${tok.value}'`)
    advance()
    return { kind: 'PrimitiveType', name: 'INTEGER' }
  }

  // ── Statements ─────────────────────────────────────────────────────────────

  function parseStatement(): Statement | null {
    const tok = peek()

    switch (tok.type) {
      case 'INPUT':      return parseInput()
      case 'OUTPUT':     return parseOutput()
      case 'IF':         return parseIf()
      case 'CASE':       return parseCase()
      case 'FOR':        return parseFor()
      case 'WHILE':      return parseWhile()
      case 'REPEAT':     return parseRepeat()
      case 'DECLARE':    return parseDeclare()
      case 'CONSTANT':   return parseConstant()
      case 'TYPE':       return parseTypeDecl()
      case 'PROCEDURE':  return parseProcedure()
      case 'FUNCTION':   return parseFunctionDecl()
      case 'CALL':       return parseCall()
      case 'RETURN':     return parseReturn()
      case 'OPEN':       return parseOpenFile()
      case 'READFILE':   return parseReadFile()
      case 'WRITEFILE':  return parseWriteFile()
      case 'CLOSEFILE':  return parseCloseFile()
      case 'IDENTIFIER': return parseAssignOrCall()
      default:
        error(`Unexpected statement keyword '${tok.value || tok.type}'`, tok)
        advance()
        return null
    }
  }

  function parseInput(): InputStatement {
    const tok = advance() // INPUT
    const target = expect('IDENTIFIER', 'Expected variable name after INPUT')
    return { kind: 'InputStatement', target: target.value, line: tok.line, column: tok.column }
  }

  function parseOutput(): OutputStatement {
    const tok = advance() // OUTPUT
    const values: Expression[] = [parseExpression()]
    while (match('COMMA')) values.push(parseExpression())
    return { kind: 'OutputStatement', values, line: tok.line, column: tok.column }
  }

  function parseAssignOrCall(): AssignStatement {
    const nameTok = advance() // IDENTIFIER
    let target: AssignStatement['target']

    if (check('LBRACKET')) {
      advance()
      const indices: Expression[] = [parseExpression()]
      while (match('COMMA')) indices.push(parseExpression())
      expect('RBRACKET', 'Expected "]"')
      target = { kind: 'ArrayAccess', name: nameTok.value, indices, line: nameTok.line, column: nameTok.column } as ArrayAccess
    } else if (check('DOT')) {
      advance()
      const field = expect('IDENTIFIER', 'Expected field name')
      target = { kind: 'RecordAccess', record: nameTok.value, field: field.value, line: nameTok.line, column: nameTok.column } as RecordAccess
    } else {
      target = { kind: 'Identifier', name: nameTok.value, line: nameTok.line, column: nameTok.column } as Identifier
    }

    expect('ASSIGN', 'Expected ← for assignment')
    const value = parseExpression()
    return { kind: 'AssignStatement', target, value, line: nameTok.line, column: nameTok.column }
  }

  function parseIf(): IfStatement {
    const tok = advance() // IF
    const condition = parseExpression()
    expect('THEN', 'Expected THEN after IF condition')
    const thenBranch = parseBlock(['ELSE', 'ENDIF'])
    let elseBranch: Statement[] = []
    if (match('ELSE')) {
      elseBranch = parseBlock(['ENDIF'])
    }
    expect('ENDIF', 'Expected ENDIF to close IF block')
    return { kind: 'IfStatement', condition, thenBranch, elseBranch, line: tok.line, column: tok.column }
  }

  function parseCase(): CaseStatement {
    const tok = advance() // CASE
    expect('OF', 'Expected OF after CASE')
    const subject = parseExpression()
    const clauses: CaseClause[] = []
    let otherwise: Statement[] = []

    function isNextClauseStart(): boolean {
      const t0 = peek(0)
      const t1 = peek(1)
      const valueTypes: TokenType[] = ['INTEGER_LITERAL', 'REAL_LITERAL', 'STRING_LITERAL', 'BOOLEAN_LITERAL', 'IDENTIFIER', 'MINUS', 'DASH']
      return (valueTypes.includes(t0.type) && t1.type === 'COLON') ||
        t0.type === 'OTHERWISE' || t0.type === 'ENDCASE'
    }

    while (!check('ENDCASE') && pos < toks.length) {
      if (match('OTHERWISE')) {
        expect('COLON', 'Expected ":" after OTHERWISE')
        // OTHERWISE body: one statement per line, until ENDCASE
        otherwise = parseBlock(['ENDCASE'])
        break
      }
      const val = parseExpression()
      expect('COLON', 'Expected ":" after case value')
      const body: Statement[] = []
      while (pos < toks.length && !isNextClauseStart()) {
        const s = parseStatement()
        if (s) body.push(s)
      }
      clauses.push({ value: val, body, line: val.line, column: val.column })
    }
    expect('ENDCASE', 'Expected ENDCASE')
    return { kind: 'CaseStatement', subject, clauses, otherwise, line: tok.line, column: tok.column }
  }

  function parseFor(): ForStatement {
    const tok = advance() // FOR
    const varTok = expect('IDENTIFIER', 'Expected loop variable after FOR')
    expect('ASSIGN', 'Expected ← after FOR variable')
    const from = parseExpression()
    expect('TO', 'Expected TO in FOR loop')
    const to = parseExpression()
    let step: Expression | null = null
    if (match('STEP')) step = parseExpression()
    const body = parseBlock(['NEXT'])
    expect('NEXT', 'Expected NEXT to close FOR loop')
    // Optional: NEXT variable — consume if present
    if (check('IDENTIFIER') && peek().value.toUpperCase() === varTok.value.toUpperCase()) advance()
    return { kind: 'ForStatement', variable: varTok.value, from, to, step, body, line: tok.line, column: tok.column }
  }

  function parseWhile(): WhileStatement {
    const tok = advance() // WHILE
    const condition = parseExpression()
    expect('DO', 'Expected DO after WHILE condition')
    const body = parseBlock(['ENDWHILE'])
    expect('ENDWHILE', 'Expected ENDWHILE')
    return { kind: 'WhileStatement', condition, body, line: tok.line, column: tok.column }
  }

  function parseRepeat(): RepeatStatement {
    const tok = advance() // REPEAT
    const body = parseBlock(['UNTIL'])
    expect('UNTIL', 'Expected UNTIL to close REPEAT block')
    const condition = parseExpression()
    return { kind: 'RepeatStatement', body, condition, line: tok.line, column: tok.column }
  }

  function parseDeclare(): DeclareStatement {
    const tok = advance() // DECLARE
    const nameTok = expect('IDENTIFIER', 'Expected identifier after DECLARE')
    expect('COLON', 'Expected ":" after identifier in DECLARE')
    const dataType = parseDataType()
    return { kind: 'DeclareStatement', name: nameTok.value, dataType, line: tok.line, column: tok.column }
  }

  function parseConstant(): ConstantStatement {
    const tok = advance() // CONSTANT
    const nameTok = expect('IDENTIFIER', 'Expected constant name')
    expect('ASSIGN', 'Expected ← after constant name')
    const value = parseExpression()
    return { kind: 'ConstantStatement', name: nameTok.value, value, line: tok.line, column: tok.column }
  }

  function parseTypeDecl(): TypeDecl {
    const tok = advance() // TYPE
    const nameTok = expect('IDENTIFIER', 'Expected type name after TYPE')
    const fields: FieldDecl[] = []
    while (!check('ENDTYPE') && pos < toks.length) {
      expect('DECLARE', 'Expected DECLARE inside TYPE block')
      const fieldName = expect('IDENTIFIER', 'Expected field name')
      expect('COLON', 'Expected ":" after field name')
      const fieldType = parseDataType()
      fields.push({ name: fieldName.value, dataType: fieldType })
    }
    expect('ENDTYPE', 'Expected ENDTYPE')
    return { kind: 'TypeDecl', name: nameTok.value, fields, line: tok.line, column: tok.column }
  }

  function parseParams(): Parameter[] {
    const params: Parameter[] = []
    if (check('RPAREN') || check('EOF' as TokenType)) return params
    do {
      const nameTok = expect('IDENTIFIER', 'Expected parameter name')
      expect('COLON', 'Expected ":" after parameter name')
      const dataType = parseDataType()
      params.push({ name: nameTok.value, dataType })
    } while (match('COMMA'))
    return params
  }

  function parseProcedure(): ProcedureDecl {
    const tok = advance() // PROCEDURE
    const nameTok = expect('IDENTIFIER', 'Expected procedure name')
    let params: Parameter[] = []
    if (match('LPAREN')) {
      params = parseParams()
      expect('RPAREN', 'Expected ")" after procedure parameters')
    }
    const body = parseBlock(['ENDPROCEDURE'])
    expect('ENDPROCEDURE', 'Expected ENDPROCEDURE')
    return { kind: 'ProcedureDecl', name: nameTok.value, params, body, line: tok.line, column: tok.column }
  }

  function parseFunctionDecl(): FunctionDecl {
    const tok = advance() // FUNCTION
    const nameTok = expect('IDENTIFIER', 'Expected function name')
    let params: Parameter[] = []
    if (match('LPAREN')) {
      params = parseParams()
      expect('RPAREN', 'Expected ")" after function parameters')
    }
    expect('RETURNS', 'Expected RETURNS after function signature')
    const returnType = parseDataType()
    const body = parseBlock(['ENDFUNCTION'])
    expect('ENDFUNCTION', 'Expected ENDFUNCTION')
    return { kind: 'FunctionDecl', name: nameTok.value, params, returnType, body, line: tok.line, column: tok.column }
  }

  function parseCall(): CallStatement {
    const tok = advance() // CALL
    const nameTok = expect('IDENTIFIER', 'Expected procedure name after CALL')
    let args: Expression[] = []
    if (match('LPAREN')) {
      if (!check('RPAREN')) {
        args = [parseExpression()]
        while (match('COMMA')) args.push(parseExpression())
      }
      expect('RPAREN', 'Expected ")" after arguments')
    }
    return { kind: 'CallStatement', name: nameTok.value, args, line: tok.line, column: tok.column }
  }

  function canStartExpression(): boolean {
    const t = peek().type
    return t === 'INTEGER_LITERAL' || t === 'REAL_LITERAL' ||
      t === 'STRING_LITERAL' || t === 'BOOLEAN_LITERAL' ||
      t === 'IDENTIFIER' || t === 'LPAREN' ||
      t === 'MINUS' || t === 'DASH' || t === 'NOT' ||
      t === 'LENGTH' || t === 'LEFT' || t === 'RIGHT' ||
      t === 'MID' || t === 'ASC' || t === 'EOF_FN'
  }

  function parseReturn(): ReturnStatement {
    const tok = advance() // RETURN
    const value = canStartExpression() ? parseExpression() : null
    return { kind: 'ReturnStatement', value, line: tok.line, column: tok.column }
  }

  function parseOpenFile(): OpenFileStatement {
    const tok = advance() // OPEN
    const file = parseExpression()
    expect('FOR', 'Expected FOR after file identifier in OPEN')
    const modeTok = peek()
    if (!FILE_MODES.has(modeTok.value.toUpperCase())) {
      error(`Expected READ, WRITE, or APPEND but got '${modeTok.value}'`)
    }
    advance()
    return { kind: 'OpenFileStatement', file, mode: modeTok.value.toUpperCase() as OpenFileStatement['mode'], line: tok.line, column: tok.column }
  }

  function parseReadFile(): ReadFileStatement {
    const tok = advance() // READFILE
    const file = parseExpression()
    expect('COMMA', 'Expected "," after file identifier in READFILE')
    const varTok = expect('IDENTIFIER', 'Expected variable name in READFILE')
    return { kind: 'ReadFileStatement', file, variable: varTok.value, line: tok.line, column: tok.column }
  }

  function parseWriteFile(): WriteFileStatement {
    const tok = advance() // WRITEFILE
    const file = parseExpression()
    expect('COMMA', 'Expected "," after file identifier in WRITEFILE')
    const value = parseExpression()
    return { kind: 'WriteFileStatement', file, value, line: tok.line, column: tok.column }
  }

  function parseCloseFile(): CloseFileStatement {
    const tok = advance() // CLOSEFILE
    const file = parseExpression()
    return { kind: 'CloseFileStatement', file, line: tok.line, column: tok.column }
  }

  // Parses statements until one of the stop keywords is peeked
  function parseBlock(stopAt: TokenType[]): Statement[] {
    const stmts: Statement[] = []
    while (pos < toks.length && !stopAt.includes(peek().type as TokenType)) {
      const stmt = parseStatement()
      if (stmt) stmts.push(stmt)
    }
    return stmts
  }

  // ── Program ────────────────────────────────────────────────────────────────

  const body = parseBlock([])
  const program: Program = { kind: 'Program', body, line: 1, column: 1 }
  return { program, errors }
}