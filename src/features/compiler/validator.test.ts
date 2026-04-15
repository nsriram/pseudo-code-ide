import { describe, it, expect } from 'vitest'
import { tokenize } from './lexer'
import { parse } from './parser'
import { validate } from './validator'

function check(source: string) {
  const { tokens } = tokenize(source)
  const { program } = parse(tokens)
  return validate(program)
}

function errorMessages(source: string): string[] {
  return check(source).map((e) => e.message)
}

describe('validator', () => {
  describe('undeclared variables', () => {
    it('reports error when variable used before declaration', () => {
      const msgs = errorMessages('OUTPUT x')
      expect(msgs).toContain("Variable 'x' used before declaration")
    })

    it('no error when variable is declared before use', () => {
      const errors = check('DECLARE x : INTEGER\nx ← 5\nOUTPUT x')
      expect(errors).toHaveLength(0)
    })

    it('no error for INPUT into declared variable', () => {
      const errors = check('DECLARE x : INTEGER\nINPUT x')
      expect(errors).toHaveLength(0)
    })

    it('reports error for INPUT into undeclared variable', () => {
      const msgs = errorMessages('INPUT x')
      expect(msgs).toContain("Variable 'x' used before declaration")
    })
  })

  describe('constant reassignment', () => {
    it('reports error when constant is reassigned', () => {
      const msgs = errorMessages('CONSTANT pi ← 3.14\npi ← 3')
      expect(msgs).toContain("Cannot assign to constant 'pi'")
    })

    it('no error for constant used in expression', () => {
      const errors = check('CONSTANT pi ← 3.14\nDECLARE r : REAL\nr ← pi * 2')
      expect(errors).toHaveLength(0)
    })
  })

  describe('duplicate declarations', () => {
    it('reports error for duplicate variable declaration', () => {
      const msgs = errorMessages('DECLARE x : INTEGER\nDECLARE x : REAL')
      expect(msgs.some((m) => /already declared/i.test(m))).toBe(true)
    })

    it('reports error for duplicate constant declaration', () => {
      const msgs = errorMessages('CONSTANT pi ← 3.14\nCONSTANT pi ← 3.14')
      expect(msgs.some((m) => /already declared/i.test(m))).toBe(true)
    })

    it('reports error for duplicate procedure declaration', () => {
      const msgs = errorMessages('PROCEDURE Foo\n  OUTPUT 1\nENDPROCEDURE\nPROCEDURE Foo\n  OUTPUT 2\nENDPROCEDURE')
      expect(msgs.some((m) => /already declared/i.test(m))).toBe(true)
    })
  })

  describe('RETURN outside FUNCTION', () => {
    it('reports error when RETURN used at top level', () => {
      const msgs = errorMessages('DECLARE x : INTEGER\nRETURN x')
      expect(msgs).toContain('RETURN can only be used inside a FUNCTION')
    })

    it('reports error when RETURN used inside PROCEDURE', () => {
      const msgs = errorMessages('PROCEDURE Foo\n  DECLARE x : INTEGER\n  RETURN x\nENDPROCEDURE')
      expect(msgs).toContain('RETURN can only be used inside a FUNCTION')
    })

    it('no error when RETURN used inside FUNCTION', () => {
      const errors = check('FUNCTION Double(n : INTEGER)\n  RETURNS INTEGER\n  DECLARE result : INTEGER\n  result ← n * 2\n  RETURN result\nENDFUNCTION')
      expect(errors).toHaveLength(0)
    })
  })

  describe('FOR loop variable', () => {
    it('allows use of loop variable inside FOR body', () => {
      const errors = check('FOR i ← 1 TO 10\n  OUTPUT i\nNEXT i')
      expect(errors).toHaveLength(0)
    })
  })

  describe('procedure and function calls', () => {
    it('reports error when calling undefined procedure', () => {
      const msgs = errorMessages('CALL Greet')
      expect(msgs).toContain("Procedure 'Greet' is not defined")
    })

    it('no error when calling defined procedure', () => {
      const errors = check('PROCEDURE Greet\n  OUTPUT "Hi"\nENDPROCEDURE\nCALL Greet')
      expect(errors).toHaveLength(0)
    })

    it('reports error on wrong argument count for procedure', () => {
      const msgs = errorMessages('PROCEDURE Say(msg : STRING)\n  OUTPUT msg\nENDPROCEDURE\nCALL Say')
      expect(msgs.some((m) => /expects 1 argument/i.test(m))).toBe(true)
    })

    it('reports error on wrong argument count for function', () => {
      const msgs = errorMessages('FUNCTION Add(a : INTEGER, b : INTEGER)\n  RETURNS INTEGER\n  RETURN a + b\nENDFUNCTION\nDECLARE r : INTEGER\nr ← Add(1)')
      expect(msgs.some((m) => /expects 2 argument/i.test(m))).toBe(true)
    })

    it('reports error when calling undefined function', () => {
      const msgs = errorMessages('DECLARE r : INTEGER\nr ← Mystery(1)')
      expect(msgs).toContain("Function 'Mystery' is not defined")
    })
  })

  describe('procedure/function scope', () => {
    it('params are available inside procedure body', () => {
      const errors = check('PROCEDURE Say(msg : STRING)\n  OUTPUT msg\nENDPROCEDURE')
      expect(errors).toHaveLength(0)
    })

    it('variable declared inside procedure is not visible outside', () => {
      const msgs = errorMessages('PROCEDURE Foo\n  DECLARE x : INTEGER\n  x ← 1\nENDPROCEDURE\nOUTPUT x')
      expect(msgs).toContain("Variable 'x' used before declaration")
    })
  })

  describe('data type validation', () => {
    it('accepts all valid primitive types', () => {
      const src = [
        'DECLARE a : INTEGER',
        'DECLARE b : REAL',
        'DECLARE c : STRING',
        'DECLARE d : BOOLEAN',
        'DECLARE e : CHAR',
        'DECLARE f : DATE',
      ].join('\n')
      expect(check(src)).toHaveLength(0)
    })

    it('reports error for completely unknown type name', () => {
      const msgs = errorMessages('DECLARE n1 : I')
      expect(msgs.some((m) => /unknown type/i.test(m))).toBe(true)
    })

    it('reports error for partial type name', () => {
      const msgs = errorMessages('DECLARE n1 : In')
      expect(msgs.some((m) => /unknown type/i.test(m))).toBe(true)
    })

    it('accepts mis-cased primitive type names (lexer normalises them)', () => {
      // The lexer converts 'integer' → token type INTEGER before parsing,
      // so it is treated as a valid PrimitiveType, not an unknown NamedType.
      expect(check('DECLARE n1 : integer')).toHaveLength(0)
    })

    it('accepts a user-defined TYPE as a valid type name', () => {
      const src = [
        'TYPE',
        'TBook',
        '  DECLARE title : STRING',
        'ENDTYPE',
        'DECLARE book : TBook',
      ].join('\n')
      expect(check(src)).toHaveLength(0)
    })

    it('reports error when referencing an undeclared named type', () => {
      const msgs = errorMessages('DECLARE book : TBook')
      expect(msgs.some((m) => /unknown type 'TBook'/i.test(m))).toBe(true)
    })

    it('reports error for invalid type in ARRAY element', () => {
      const msgs = errorMessages('DECLARE scores : ARRAY[1:5] OF Numbr')
      expect(msgs.some((m) => /unknown type 'Numbr'/i.test(m))).toBe(true)
    })
  })

  describe('CASE OF statement', () => {
    it('validates CASE OF without errors', () => {
      const src = [
        'DECLARE dir : STRING',
        'dir ← "N"',
        'CASE OF dir',
        '  "N": OUTPUT "North"',
        '  "S": OUTPUT "South"',
        '  OTHERWISE: OUTPUT "Unknown"',
        'ENDCASE',
      ].join('\n')
      expect(check(src)).toHaveLength(0)
    })

    it('reports error for undeclared variable in CASE subject', () => {
      const msgs = errorMessages('CASE OF unknown\n  1: OUTPUT "x"\nENDCASE')
      expect(msgs).toContain("Variable 'unknown' used before declaration")
    })

    it('reports error for undeclared variable used in CASE clause', () => {
      const msgs = errorMessages('DECLARE x : INTEGER\nx ← 1\nCASE OF x\n  1: OUTPUT undeclaredVar\nENDCASE')
      expect(msgs).toContain("Variable 'undeclaredVar' used before declaration")
    })
  })

  describe('FOR loop with STEP', () => {
    it('validates FOR loop with STEP without errors', () => {
      const src = 'FOR i ← 1 TO 10 STEP 2\n  OUTPUT i\nNEXT i'
      expect(check(src)).toHaveLength(0)
    })
  })

  describe('TYPE declaration', () => {
    it('reports error for duplicate TYPE declaration', () => {
      const src = 'TYPE\nTBook\n  DECLARE title : STRING\nENDTYPE\nTYPE\nTBook\n  DECLARE title : STRING\nENDTYPE'
      const msgs = errorMessages(src)
      expect(msgs.some((m) => /already declared/i.test(m))).toBe(true)
    })
  })

  describe('calling non-procedure identifiers', () => {
    it('reports error when calling a variable as a procedure', () => {
      const msgs = errorMessages('DECLARE x : INTEGER\nCALL x')
      expect(msgs).toContain("'x' is not a procedure")
    })
  })

  describe('duplicate function declaration', () => {
    it('reports error for duplicate function declaration', () => {
      const src = [
        'FUNCTION Double(n : INTEGER)',
        '  RETURNS INTEGER',
        '  RETURN n * 2',
        'ENDFUNCTION',
        'FUNCTION Double(n : INTEGER)',
        '  RETURNS INTEGER',
        '  RETURN n * 2',
        'ENDFUNCTION',
      ].join('\n')
      const msgs = errorMessages(src)
      expect(msgs.some((m) => /already declared/i.test(m))).toBe(true)
    })
  })

  describe('file operations', () => {
    it('validates OPENFILE without errors', () => {
      const src = 'DECLARE filename : STRING\nfilename ← "data.txt"\nOPEN filename FOR READ'
      expect(check(src)).toHaveLength(0)
    })

    it('validates READFILE without errors', () => {
      const src = [
        'DECLARE filename : STRING',
        'DECLARE line : STRING',
        'filename ← "data.txt"',
        'OPEN filename FOR READ',
        'READFILE filename, line',
        'CLOSEFILE filename',
      ].join('\n')
      expect(check(src)).toHaveLength(0)
    })

    it('reports error for READFILE with undeclared variable', () => {
      const src = 'DECLARE filename : STRING\nfilename ← "f.txt"\nREADFILE filename, undeclaredVar'
      const msgs = errorMessages(src)
      expect(msgs).toContain("Variable 'undeclaredVar' used before declaration")
    })

    it('validates WRITEFILE without errors', () => {
      const src = [
        'DECLARE filename : STRING',
        'DECLARE data : STRING',
        'filename ← "out.txt"',
        'data ← "hello"',
        'OPEN filename FOR WRITE',
        'WRITEFILE filename, data',
        'CLOSEFILE filename',
      ].join('\n')
      expect(check(src)).toHaveLength(0)
    })

    it('validates CLOSEFILE without errors', () => {
      const src = 'DECLARE filename : STRING\nfilename ← "data.txt"\nOPEN filename FOR READ\nCLOSEFILE filename'
      expect(check(src)).toHaveLength(0)
    })
  })

  describe('array access', () => {
    it('validates array access without errors', () => {
      const src = 'DECLARE scores : ARRAY[1:5] OF INTEGER\nOUTPUT scores[1]'
      expect(check(src)).toHaveLength(0)
    })

    it('reports error for undeclared array access', () => {
      const msgs = errorMessages('OUTPUT noSuchArray[0]')
      expect(msgs).toContain("Array 'noSuchArray' used before declaration")
    })
  })

  describe('valid programs', () => {
    it('validates a complete program without errors', () => {
      const src = [
        'DECLARE Total : INTEGER',
        'DECLARE Number : INTEGER',
        'Total ← 0',
        'FOR i ← 1 TO 10',
        '  INPUT Number',
        '  Total ← Total + Number',
        'NEXT i',
        'OUTPUT "Total: ", Total',
      ].join('\n')
      expect(check(src)).toHaveLength(0)
    })

    it('validates WHILE loop without errors', () => {
      const src = 'DECLARE x : INTEGER\nx ← 0\nWHILE x < 10 DO\n  x ← x + 1\nENDWHILE'
      expect(check(src)).toHaveLength(0)
    })

    it('validates REPEAT UNTIL without errors', () => {
      const src = 'DECLARE x : INTEGER\nREPEAT\n  INPUT x\nUNTIL x > 0'
      expect(check(src)).toHaveLength(0)
    })
  })
})