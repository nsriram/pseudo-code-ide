import { describe, it, expect } from 'vitest'
import { tokenize } from './lexer'
import { parse } from './parser'
import type { Program, Statement } from './ast'

function parseSource(source: string): { program: Program; errors: ReturnType<typeof parse>['errors'] } {
  const { tokens } = tokenize(source)
  return parse(tokens)
}

function firstStmt(source: string): Statement {
  const { program } = parseSource(source)
  return program.body[0]
}

describe('parser', () => {
  describe('INPUT', () => {
    it('parses INPUT statement', () => {
      const stmt = firstStmt('INPUT Name')
      expect(stmt.kind).toBe('InputStatement')
      if (stmt.kind === 'InputStatement') expect(stmt.target).toBe('Name')
    })
  })

  describe('OUTPUT', () => {
    it('parses OUTPUT with string literal', () => {
      const stmt = firstStmt('OUTPUT "Hello"')
      expect(stmt.kind).toBe('OutputStatement')
    })

    it('parses OUTPUT with multiple values', () => {
      const stmt = firstStmt('OUTPUT "Name: ", Name')
      expect(stmt.kind).toBe('OutputStatement')
      if (stmt.kind === 'OutputStatement') expect(stmt.values).toHaveLength(2)
    })
  })

  describe('ASSIGN', () => {
    it('parses simple assignment', () => {
      const stmt = firstStmt('x ← 42')
      expect(stmt.kind).toBe('AssignStatement')
    })

    it('parses assignment with arithmetic expression', () => {
      const stmt = firstStmt('Total ← Total + Number')
      expect(stmt.kind).toBe('AssignStatement')
      if (stmt.kind === 'AssignStatement') expect(stmt.value.kind).toBe('BinaryExpr')
    })

    it('parses array element assignment', () => {
      const stmt = firstStmt('myList[3] ← 99')
      expect(stmt.kind).toBe('AssignStatement')
      if (stmt.kind === 'AssignStatement') expect(stmt.target.kind).toBe('ArrayAccess')
    })

    it('parses record field assignment', () => {
      const stmt = firstStmt('Book.author ← "Watson"')
      expect(stmt.kind).toBe('AssignStatement')
      if (stmt.kind === 'AssignStatement') expect(stmt.target.kind).toBe('RecordAccess')
    })
  })

  describe('IF', () => {
    it('parses IF THEN ENDIF', () => {
      const stmt = firstStmt('IF x > 0\n  THEN\n    OUTPUT x\nENDIF')
      expect(stmt.kind).toBe('IfStatement')
      if (stmt.kind === 'IfStatement') {
        expect(stmt.thenBranch).toHaveLength(1)
        expect(stmt.elseBranch).toHaveLength(0)
      }
    })

    it('parses IF THEN ELSE ENDIF', () => {
      const stmt = firstStmt('IF x > 0\n  THEN\n    OUTPUT "pos"\n  ELSE\n    OUTPUT "neg"\nENDIF')
      expect(stmt.kind).toBe('IfStatement')
      if (stmt.kind === 'IfStatement') {
        expect(stmt.thenBranch).toHaveLength(1)
        expect(stmt.elseBranch).toHaveLength(1)
      }
    })

    it('reports error when ENDIF is missing', () => {
      const { errors } = parseSource('IF x > 0\n  THEN\n    OUTPUT x')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some((e) => /ENDIF/i.test(e.message))).toBe(true)
    })
  })

  describe('CASE', () => {
    it('parses CASE OF ENDCASE', () => {
      const stmt = firstStmt('CASE OF dir\n  "N": OUTPUT 1\n  "S": OUTPUT 2\nENDCASE')
      expect(stmt.kind).toBe('CaseStatement')
      if (stmt.kind === 'CaseStatement') expect(stmt.clauses).toHaveLength(2)
    })

    it('parses CASE with OTHERWISE', () => {
      const stmt = firstStmt('CASE OF x\n  1: OUTPUT "one"\n  OTHERWISE: OUTPUT "other"\nENDCASE')
      expect(stmt.kind).toBe('CaseStatement')
      if (stmt.kind === 'CaseStatement') expect(stmt.otherwise).toHaveLength(1)
    })
  })

  describe('FOR loop', () => {
    it('parses FOR TO NEXT', () => {
      const stmt = firstStmt('FOR i ← 1 TO 10\n  OUTPUT i\nNEXT i')
      expect(stmt.kind).toBe('ForStatement')
      if (stmt.kind === 'ForStatement') {
        expect(stmt.variable).toBe('i')
        expect(stmt.step).toBeNull()
      }
    })

    it('parses FOR TO STEP NEXT', () => {
      const stmt = firstStmt('FOR i ← 1 TO 10 STEP 2\n  OUTPUT i\nNEXT i')
      expect(stmt.kind).toBe('ForStatement')
      if (stmt.kind === 'ForStatement') expect(stmt.step).not.toBeNull()
    })
  })

  describe('WHILE loop', () => {
    it('parses WHILE DO ENDWHILE', () => {
      const stmt = firstStmt('WHILE x > 0 DO\n  INPUT x\nENDWHILE')
      expect(stmt.kind).toBe('WhileStatement')
      if (stmt.kind === 'WhileStatement') expect(stmt.body).toHaveLength(1)
    })

    it('reports error when ENDWHILE is missing', () => {
      const { errors } = parseSource('WHILE x > 0 DO\n  INPUT x')
      expect(errors.some((e) => /ENDWHILE/i.test(e.message))).toBe(true)
    })
  })

  describe('REPEAT loop', () => {
    it('parses REPEAT UNTIL', () => {
      const stmt = firstStmt('REPEAT\n  INPUT x\nUNTIL x > 0')
      expect(stmt.kind).toBe('RepeatStatement')
      if (stmt.kind === 'RepeatStatement') expect(stmt.body).toHaveLength(1)
    })
  })

  describe('DECLARE', () => {
    it('parses DECLARE with primitive type', () => {
      const stmt = firstStmt('DECLARE x : INTEGER')
      expect(stmt.kind).toBe('DeclareStatement')
      if (stmt.kind === 'DeclareStatement') {
        expect(stmt.name).toBe('x')
        expect(stmt.dataType.kind).toBe('PrimitiveType')
      }
    })

    it('parses DECLARE with 1D array type', () => {
      const stmt = firstStmt('DECLARE myList : ARRAY[0:8] OF INTEGER')
      expect(stmt.kind).toBe('DeclareStatement')
      if (stmt.kind === 'DeclareStatement') expect(stmt.dataType.kind).toBe('ArrayType')
    })

    it('parses DECLARE with 2D array type', () => {
      const stmt = firstStmt('DECLARE grid : ARRAY[0:3,0:3] OF INTEGER')
      expect(stmt.kind).toBe('DeclareStatement')
      if (stmt.kind === 'DeclareStatement') {
        expect(stmt.dataType.kind).toBe('ArrayType')
        if (stmt.dataType.kind === 'ArrayType') expect(stmt.dataType.bounds).toHaveLength(2)
      }
    })
  })

  describe('CONSTANT', () => {
    it('parses CONSTANT declaration', () => {
      const stmt = firstStmt('CONSTANT pi ← 3.142')
      expect(stmt.kind).toBe('ConstantStatement')
      if (stmt.kind === 'ConstantStatement') expect(stmt.name).toBe('pi')
    })
  })

  describe('TYPE record', () => {
    it('parses TYPE ENDTYPE with fields', () => {
      const src = 'TYPE\nTBook\n  DECLARE title : STRING\n  DECLARE pages : INTEGER\nENDTYPE'
      const stmt = firstStmt(src)
      expect(stmt.kind).toBe('TypeDecl')
      if (stmt.kind === 'TypeDecl') {
        expect(stmt.name).toBe('TBook')
        expect(stmt.fields).toHaveLength(2)
      }
    })
  })

  describe('PROCEDURE', () => {
    it('parses PROCEDURE without params', () => {
      const stmt = firstStmt('PROCEDURE Greet\n  OUTPUT "Hi"\nENDPROCEDURE')
      expect(stmt.kind).toBe('ProcedureDecl')
      if (stmt.kind === 'ProcedureDecl') {
        expect(stmt.name).toBe('Greet')
        expect(stmt.params).toHaveLength(0)
      }
    })

    it('parses PROCEDURE with params', () => {
      const stmt = firstStmt('PROCEDURE Say(msg : STRING)\n  OUTPUT msg\nENDPROCEDURE')
      expect(stmt.kind).toBe('ProcedureDecl')
      if (stmt.kind === 'ProcedureDecl') expect(stmt.params).toHaveLength(1)
    })
  })

  describe('FUNCTION', () => {
    it('parses FUNCTION with params and RETURNS', () => {
      const stmt = firstStmt('FUNCTION Add(a : INTEGER, b : INTEGER)\n  RETURNS INTEGER\n  RETURN a + b\nENDFUNCTION')
      expect(stmt.kind).toBe('FunctionDecl')
      if (stmt.kind === 'FunctionDecl') {
        expect(stmt.name).toBe('Add')
        expect(stmt.params).toHaveLength(2)
        expect(stmt.returnType.kind).toBe('PrimitiveType')
      }
    })
  })

  describe('CALL', () => {
    it('parses CALL without args', () => {
      const stmt = firstStmt('CALL Greet')
      expect(stmt.kind).toBe('CallStatement')
      if (stmt.kind === 'CallStatement') expect(stmt.args).toHaveLength(0)
    })

    it('parses CALL with args', () => {
      const stmt = firstStmt('CALL Say("Hello")')
      expect(stmt.kind).toBe('CallStatement')
      if (stmt.kind === 'CallStatement') expect(stmt.args).toHaveLength(1)
    })
  })

  describe('RETURN', () => {
    it('parses RETURN statement', () => {
      const stmt = firstStmt('RETURN x + 1')
      expect(stmt.kind).toBe('ReturnStatement')
    })
  })

  describe('File operations', () => {
    it('parses OPEN FOR READ', () => {
      const stmt = firstStmt('OPEN myFile FOR READ')
      expect(stmt.kind).toBe('OpenFileStatement')
      if (stmt.kind === 'OpenFileStatement') expect(stmt.mode).toBe('READ')
    })

    it('parses READFILE', () => {
      const stmt = firstStmt('READFILE myFile, line')
      expect(stmt.kind).toBe('ReadFileStatement')
    })

    it('parses WRITEFILE', () => {
      const stmt = firstStmt('WRITEFILE myFile, data')
      expect(stmt.kind).toBe('WriteFileStatement')
    })

    it('parses CLOSEFILE', () => {
      const stmt = firstStmt('CLOSEFILE myFile')
      expect(stmt.kind).toBe('CloseFileStatement')
    })
  })

  describe('Expressions', () => {
    it('parses nested arithmetic', () => {
      const stmt = firstStmt('x ← (a + b) * c')
      expect(stmt.kind).toBe('AssignStatement')
      if (stmt.kind === 'AssignStatement') expect(stmt.value.kind).toBe('BinaryExpr')
    })

    it('parses string concatenation with &', () => {
      const stmt = firstStmt('s ← "Hello" & " " & name')
      expect(stmt.kind).toBe('AssignStatement')
    })

    it('parses function call in expression', () => {
      const stmt = firstStmt('n ← LENGTH(myString)')
      expect(stmt.kind).toBe('AssignStatement')
      if (stmt.kind === 'AssignStatement') expect(stmt.value.kind).toBe('FunctionCall')
    })

    it('parses 2D array access', () => {
      const stmt = firstStmt('x ← grid[1,2]')
      expect(stmt.kind).toBe('AssignStatement')
      if (stmt.kind === 'AssignStatement') {
        expect(stmt.value.kind).toBe('ArrayAccess')
        if (stmt.value.kind === 'ArrayAccess') expect(stmt.value.indices).toHaveLength(2)
      }
    })
  })

  describe('no errors for valid programs', () => {
    it('parses a multi-statement program without errors', () => {
      const src = [
        'DECLARE Total : INTEGER',
        'Total ← 0',
        'FOR i ← 1 TO 10',
        '  INPUT Number',
        '  Total ← Total + Number',
        'NEXT i',
        'OUTPUT "Total: ", Total',
      ].join('\n')
      const { errors } = parseSource(src)
      expect(errors).toHaveLength(0)
    })
  })
})