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