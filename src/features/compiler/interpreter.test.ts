import { describe, it, expect } from 'vitest'
import { tokenize } from './lexer'
import { parse } from './parser'
import { interpret } from './interpreter'

function run(source: string, inputs: string[] = []) {
  const { tokens } = tokenize(source)
  const { program } = parse(tokens)
  return interpret(program, inputs)
}

describe('interpreter', () => {
  describe('OUTPUT statement', () => {
    it('outputs a string literal', () => {
      expect(run('OUTPUT "hello"').output).toBe('hello')
    })

    it('outputs an integer literal', () => {
      expect(run('OUTPUT 42').output).toBe('42')
    })

    it('outputs multiple values concatenated', () => {
      expect(run('OUTPUT "x = ", 5').output).toBe('x = 5')
    })

    it('outputs boolean as TRUE/FALSE', () => {
      expect(run('OUTPUT TRUE').output).toBe('TRUE')
      expect(run('OUTPUT FALSE').output).toBe('FALSE')
    })
  })

  describe('INPUT statement', () => {
    it('reads a number input', () => {
      expect(run('DECLARE x : INTEGER\nINPUT x\nOUTPUT x', ['42']).output).toBe('42')
    })

    it('reads a string input when not a number', () => {
      expect(run('DECLARE s : STRING\nINPUT s\nOUTPUT s', ['hello']).output).toBe('hello')
    })

    it('throws when more inputs are needed than provided', () => {
      const { error } = run('DECLARE x : INTEGER\nINPUT x\nINPUT x')
      expect(error).toMatch(/more inputs/i)
    })
  })

  describe('assignment and arithmetic', () => {
    it('assigns and outputs a computed value', () => {
      expect(run('DECLARE x : INTEGER\nx ← 3 + 4\nOUTPUT x').output).toBe('7')
    })

    it('integer division (DIV)', () => {
      expect(run('OUTPUT 7 DIV 2').output).toBe('3')
    })

    it('modulo (MOD)', () => {
      expect(run('OUTPUT 7 MOD 3').output).toBe('1')
    })

    it('string concatenation with &', () => {
      expect(run('OUTPUT "Hello" & " " & "World"').output).toBe('Hello World')
    })

    it('unary minus', () => {
      expect(run('DECLARE x : INTEGER\nx ← -5\nOUTPUT x').output).toBe('-5')
    })
  })

  describe('CONSTANT', () => {
    it('uses constant value', () => {
      expect(run('CONSTANT PI ← 3.14\nOUTPUT PI').output).toBe('3.14')
    })
  })

  describe('IF statement', () => {
    it('executes THEN branch when condition is true', () => {
      const { output } = run('DECLARE x : INTEGER\nx ← 5\nIF x > 3 THEN\n  OUTPUT "yes"\nENDIF')
      expect(output).toBe('yes')
    })

    it('executes ELSE branch when condition is false', () => {
      const { output } = run('DECLARE x : INTEGER\nx ← 1\nIF x > 3 THEN\n  OUTPUT "yes"\nELSE\n  OUTPUT "no"\nENDIF')
      expect(output).toBe('no')
    })
  })

  describe('CASE statement', () => {
    it('matches the correct clause', () => {
      const src = [
        'DECLARE n : INTEGER',
        'n ← 2',
        'CASE OF n',
        '  1: OUTPUT "one"',
        '  2: OUTPUT "two"',
        '  OTHERWISE: OUTPUT "other"',
        'ENDCASE',
      ].join('\n')
      expect(run(src).output).toBe('two')
    })

    it('falls through to OTHERWISE', () => {
      const src = [
        'DECLARE n : INTEGER',
        'n ← 9',
        'CASE OF n',
        '  1: OUTPUT "one"',
        '  OTHERWISE: OUTPUT "other"',
        'ENDCASE',
      ].join('\n')
      expect(run(src).output).toBe('other')
    })
  })

  describe('FOR loop', () => {
    it('iterates from 1 to 3', () => {
      const { output } = run('FOR i ← 1 TO 3\n  OUTPUT i\nNEXT i')
      expect(output).toBe('1\n2\n3')
    })

    it('respects STEP', () => {
      const { output } = run('FOR i ← 1 TO 10 STEP 3\n  OUTPUT i\nNEXT i')
      expect(output).toBe('1\n4\n7\n10')
    })
  })

  describe('WHILE loop', () => {
    it('loops until condition is false', () => {
      const src = 'DECLARE x : INTEGER\nx ← 0\nWHILE x < 3 DO\n  x ← x + 1\nENDWHILE\nOUTPUT x'
      expect(run(src).output).toBe('3')
    })

    it('does not execute body when condition is immediately false', () => {
      const src = 'DECLARE x : INTEGER\nx ← 5\nWHILE x < 3 DO\n  x ← x + 1\nENDWHILE\nOUTPUT x'
      expect(run(src).output).toBe('5')
    })
  })

  describe('REPEAT UNTIL loop', () => {
    it('executes body at least once', () => {
      const src = 'DECLARE x : INTEGER\nx ← 0\nREPEAT\n  x ← x + 1\nUNTIL x >= 3\nOUTPUT x'
      expect(run(src).output).toBe('3')
    })
  })

  describe('PROCEDURE and CALL', () => {
    it('calls a procedure with no params', () => {
      const src = 'PROCEDURE Greet\n  OUTPUT "Hi"\nENDPROCEDURE\nCALL Greet'
      expect(run(src).output).toBe('Hi')
    })

    it('calls a procedure with params', () => {
      const src = 'PROCEDURE Say(msg : STRING)\n  OUTPUT msg\nENDPROCEDURE\nCALL Say("hello")'
      expect(run(src).output).toBe('hello')
    })
  })

  describe('FUNCTION and RETURN', () => {
    it('returns a value from a function', () => {
      const src = [
        'FUNCTION Double(n : INTEGER) RETURNS INTEGER',
        '  RETURN n * 2',
        'ENDFUNCTION',
        'OUTPUT Double(5)',
      ].join('\n')
      expect(run(src).output).toBe('10')
    })

    it('recursive function (factorial)', () => {
      const src = [
        'FUNCTION Fact(n : INTEGER) RETURNS INTEGER',
        '  IF n <= 1 THEN',
        '    RETURN 1',
        '  ELSE',
        '    RETURN n * Fact(n - 1)',
        '  ENDIF',
        'ENDFUNCTION',
        'OUTPUT Fact(5)',
      ].join('\n')
      expect(run(src).output).toBe('120')
    })
  })

  describe('arrays', () => {
    it('assigns and reads array element', () => {
      const src = 'DECLARE arr : ARRAY[1:3] OF INTEGER\narr[1] ← 42\nOUTPUT arr[1]'
      expect(run(src).output).toBe('42')
    })
  })

  describe('built-in functions', () => {
    it('LENGTH of string literal', () => {
      expect(run('OUTPUT LENGTH("hello")').output).toBe('5')
    })

    it('LENGTH of a declared STRING variable', () => {
      const src = 'DECLARE s : STRING\nINPUT s\nOUTPUT LENGTH(s)'
      expect(run(src, ['Cambridge']).output).toBe('9')
    })

    it('LENGTH used in FOR loop bound', () => {
      const src = [
        'DECLARE s : STRING',
        'DECLARE i : INTEGER',
        'INPUT s',
        'FOR i ← 1 TO LENGTH(s)',
        '  OUTPUT MID(s, i, 1)',
        'NEXT i',
      ].join('\n')
      expect(run(src, ['abc']).output).toBe('a\nb\nc')
    })

    it('LENGTH assigned to INTEGER variable', () => {
      const src = 'DECLARE s : STRING\nDECLARE n : INTEGER\nINPUT s\nn ← LENGTH(s)\nOUTPUT n'
      expect(run(src, ['hi']).output).toBe('2')
    })

    it('LEFT', () => {
      expect(run('OUTPUT LEFT("hello", 3)').output).toBe('hel')
    })

    it('RIGHT', () => {
      expect(run('OUTPUT RIGHT("hello", 3)').output).toBe('llo')
    })

    it('MID', () => {
      expect(run('OUTPUT MID("hello", 2, 3)').output).toBe('ell')
    })

    it('ASC', () => {
      expect(run('OUTPUT ASC("A")').output).toBe('65')
    })

    it('UCASE / LCASE', () => {
      expect(run('OUTPUT UCASE("hello")').output).toBe('HELLO')
      expect(run('OUTPUT LCASE("HELLO")').output).toBe('hello')
    })
  })

  describe('NOT operator', () => {
    it('negates a boolean', () => {
      expect(run('OUTPUT NOT TRUE').output).toBe('FALSE')
    })
  })

  describe('step limit', () => {
    it('throws on infinite loop', () => {
      const { error } = run('DECLARE x : INTEGER\nx ← 0\nWHILE x = 0 DO\n  x ← 0\nENDWHILE')
      expect(error).toMatch(/step limit/i)
    })
  })

  describe('file operations', () => {
    it('silently ignores OPENFILE', () => {
      const src = 'DECLARE f : STRING\nf ← "test.txt"\nOPEN f FOR READ'
      expect(run(src).error).toBeNull()
    })
  })

  describe('AND / OR operators', () => {
    it('AND short-circuits on false left operand', () => {
      expect(run('DECLARE x : INTEGER\nx ← 0\nIF x > 5 AND x < 10 THEN\n  OUTPUT "yes"\nELSE\n  OUTPUT "no"\nENDIF').output).toBe('no')
    })

    it('AND returns true when both sides true', () => {
      expect(run('DECLARE x : INTEGER\nx ← 7\nIF x > 5 AND x < 10 THEN\n  OUTPUT "yes"\nENDIF').output).toBe('yes')
    })

    it('OR short-circuits on true left operand', () => {
      expect(run('DECLARE x : INTEGER\nx ← 2\nIF x < 5 OR x > 10 THEN\n  OUTPUT "yes"\nENDIF').output).toBe('yes')
    })

    it('OR evaluates right when left is false', () => {
      expect(run('DECLARE x : INTEGER\nx ← 7\nIF x < 5 OR x > 6 THEN\n  OUTPUT "yes"\nENDIF').output).toBe('yes')
    })
  })

  describe('negative step FOR loop', () => {
    it('iterates downward with negative step', () => {
      const { output } = run('FOR i ← 3 TO 1 STEP -1\n  OUTPUT i\nNEXT i')
      expect(output).toBe('3\n2\n1')
    })
  })

  describe('RecordAccess', () => {
    it('reads a field from a record-like array', () => {
      const src = [
        'DECLARE rec : ARRAY[1:1] OF INTEGER',
        'rec[1] ← 99',
        'OUTPUT rec[1]',
      ].join('\n')
      expect(run(src).output).toBe('99')
    })
  })

  describe('division by zero', () => {
    it('throws runtime error on / by zero', () => {
      expect(run('OUTPUT 1 / 0').error).toMatch(/division by zero/i)
    })

    it('throws runtime error on DIV by zero', () => {
      expect(run('OUTPUT 4 DIV 0').error).toMatch(/division by zero/i)
    })
  })

  describe('procedure RETURN early exit', () => {
    it('procedure can exit early via RETURN with no value used', () => {
      const src = [
        'PROCEDURE EarlyExit(n : INTEGER)',
        '  IF n < 0 THEN',
        '    RETURN 0',
        '  ENDIF',
        '  OUTPUT "ok"',
        'ENDPROCEDURE',
        'CALL EarlyExit(-1)',
      ].join('\n')
      // RETURN in procedure just stops execution — no crash
      expect(run(src).error).toBeNull()
    })
  })

  describe('DECLARE with non-INTEGER types', () => {
    it('initialises BOOLEAN to false', () => {
      expect(run('DECLARE b : BOOLEAN\nOUTPUT b').output).toBe('FALSE')
    })

    it('initialises CHAR to empty string', () => {
      expect(run('DECLARE c : CHAR\nOUTPUT LENGTH(c)').output).toBe('0')
    })

    it('initialises DATE to empty string', () => {
      expect(run('DECLARE d : DATE\nOUTPUT LENGTH(d)').output).toBe('0')
    })
  })

  describe('built-in functions — extended', () => {
    it('CHR converts code to character', () => {
      expect(run('OUTPUT CHR(65)').output).toBe('A')
    })

    it('INT truncates decimal', () => {
      expect(run('OUTPUT INT(3.9)').output).toBe('3')
    })

    it('ROUND rounds to integer', () => {
      expect(run('OUTPUT ROUND(3.5)').output).toBe('4')
    })

    it('ROUND with decimal places', () => {
      expect(run('OUTPUT ROUND(3.14159, 2)').output).toBe('3.14')
    })

    it('NUM_TO_STR converts number to string', () => {
      expect(run('OUTPUT LENGTH(NUM_TO_STR(42))').output).toBe('2')
    })

    it('STR_TO_NUM converts string to number', () => {
      expect(run('OUTPUT STR_TO_NUM("42") + 1').output).toBe('43')
    })

    it('IS_NUM returns TRUE for numeric string', () => {
      expect(run('OUTPUT IS_NUM("42")').output).toBe('TRUE')
    })

    it('IS_NUM returns FALSE for non-numeric', () => {
      expect(run('OUTPUT IS_NUM("hello")').output).toBe('FALSE')
    })

    it('EOF returns false', () => {
      expect(run('OUTPUT EOF("file.txt")').output).toBe('FALSE')
    })
  })
})

describe('power operator (^)', () => {
  it('computes 2^10', () => {
    expect(run('OUTPUT 2 ^ 10').output).toBe('1024')
  })
  it('is right-associative: 2^3^2 = 2^9 = 512', () => {
    expect(run('OUTPUT 2 ^ 3 ^ 2').output).toBe('512')
  })
})

describe('FOR STEP 0 guard', () => {
  it('throws when STEP is 0', () => {
    const src = 'DECLARE i : INTEGER\nFOR i ← 1 TO 5 STEP 0\n  OUTPUT i\nNEXT i'
    expect(run(src).error).toMatch(/step.*zero/i)
  })
})

describe('// comments in source', () => {
  it('ignores inline comments', () => {
    expect(run('OUTPUT 42 // answer').output).toBe('42')
  })
})

describe('CASE multi-statement body', () => {
  it('executes all statements in a CASE clause body', () => {
    const src = [
      'DECLARE n : INTEGER',
      'DECLARE total : INTEGER',
      'n ← 2',
      'total ← 0',
      'CASE OF n',
      '  2: total ← total + 1',
      '     total ← total + 1',
      '  OTHERWISE: total ← 99',
      'ENDCASE',
      'OUTPUT total',
    ].join('\n')
    expect(run(src).output).toBe('2')
  })
})

describe('bare RETURN in procedure', () => {
  it('exits procedure early without error', () => {
    const src = [
      'DECLARE x : INTEGER',
      'x ← 0',
      'PROCEDURE doNothing()',
      '  RETURN',
      '  x ← 99',
      'ENDPROCEDURE',
      'CALL doNothing()',
      'OUTPUT x',
    ].join('\n')
    expect(run(src).output).toBe('0')
  })
})