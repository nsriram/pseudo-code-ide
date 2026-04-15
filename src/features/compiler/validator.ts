import type {
  Program, Statement, Expression, DataType,
  AssignStatement, IfStatement, CaseStatement,
  ForStatement, WhileStatement, RepeatStatement,
  DeclareStatement, ConstantStatement, TypeDecl,
  ProcedureDecl, FunctionDecl,
  CallStatement,
  OpenFileStatement, ReadFileStatement, WriteFileStatement,
} from './ast'

export interface ValidationError {
  line: number
  column: number
  message: string
}

type SymbolKind = 'variable' | 'constant' | 'procedure' | 'function' | 'type'
type ValidationContext = 'global' | 'function' | 'procedure'

interface Symbol {
  kind: SymbolKind
  name: string
  dataType?: DataType
  paramCount?: number
  fields?: string[]
}

class Scope {
  private symbols = new Map<string, Symbol>()
  private parent: Scope | null

  constructor(parent: Scope | null = null) {
    this.parent = parent
  }

  define(sym: Symbol): boolean {
    const key = sym.name.toUpperCase()
    if (this.symbols.has(key)) return false
    this.symbols.set(key, sym)
    return true
  }

  lookup(name: string): Symbol | null {
    return this.symbols.get(name.toUpperCase()) ?? this.parent?.lookup(name) ?? null
  }

  has(name: string): boolean {
    const key = name.toUpperCase()
    return this.symbols.has(key) || (this.parent?.has(name) ?? false)
  }
}

export function validate(program: Program): ValidationError[] {
  const errors: ValidationError[] = []
  const globalScope = new Scope()

  function error(line: number, column: number, message: string) {
    errors.push({ line, column, message })
  }

  function checkDataType(dataType: DataType, scope: Scope, line: number, column: number) {
    if (dataType.kind === 'NamedType') {
      // NamedType is produced by the parser for any identifier that isn't a
      // known keyword — check it is an in-scope TYPE declaration.
      const sym = scope.lookup(dataType.name)
      if (!sym || sym.kind !== 'type') {
        error(line, column, `Unknown type '${dataType.name}'. Valid types: BOOLEAN, CHAR, INTEGER, REAL, STRING, DATE, or a declared TYPE name`)
      }
    } else if (dataType.kind === 'ArrayType') {
      checkDataType(dataType.elementType, scope, line, column)
    }
    // PrimitiveType is always valid; mis-cased primitives are normalised by the lexer
  }

  function checkExpr(expr: Expression, scope: Scope, context: ValidationContext) {
    switch (expr.kind) {
      case 'Identifier': {
        const sym = scope.lookup(expr.name)
        if (!sym) {
          error(expr.line, expr.column, `Variable '${expr.name}' used before declaration`)
        }
        break
      }
      case 'ArrayAccess': {
        const sym = scope.lookup(expr.name)
        if (!sym) {
          error(expr.line, expr.column, `Array '${expr.name}' used before declaration`)
        }
        expr.indices.forEach((idx) => checkExpr(idx, scope, context))
        break
      }
      case 'RecordAccess': {
        const sym = scope.lookup(expr.record)
        if (!sym) {
          error(expr.line, expr.column, `Variable '${expr.record}' used before declaration`)
          break
        }
        if (sym.dataType?.kind === 'NamedType') {
          const typeSym = scope.lookup(sym.dataType.name)
          if (typeSym?.kind === 'type' && typeSym.fields && !typeSym.fields.includes(expr.field)) {
            error(expr.line, expr.column, `Field '${expr.field}' does not exist in type '${sym.dataType.name}'`)
          }
        }
        break
      }
      case 'BinaryExpr':
        checkExpr(expr.left, scope, context)
        checkExpr(expr.right, scope, context)
        break
      case 'UnaryExpr':
        checkExpr(expr.operand, scope, context)
        break
      case 'FunctionCall': {
        const sym = scope.lookup(expr.name)
        // Allow built-ins without declaration check
        const builtins = new Set([
          'LENGTH', 'LEFT', 'RIGHT', 'MID', 'ASC', 'CHR',
          'INT', 'ROUND', 'UCASE', 'LCASE',
          'NUM_TO_STR', 'STR_TO_NUM', 'IS_NUM', 'EOF',
        ])
        if (!builtins.has(expr.name.toUpperCase()) && !sym) {
          error(expr.line, expr.column, `Function '${expr.name}' is not defined`)
        }
        if (sym && sym.kind === 'function' && sym.paramCount !== undefined && expr.args.length !== sym.paramCount) {
          error(expr.line, expr.column, `Function '${expr.name}' expects ${sym.paramCount} argument(s) but got ${expr.args.length}`)
        }
        const BUILTIN_ARITY: Record<string, number | [number, number]> = {
          LENGTH: 1, LEFT: 2, RIGHT: 2, MID: 3,
          ASC: 1, CHR: 1, INT: 1,
          ROUND: [1, 2],
          UCASE: 1, LCASE: 1, NUM_TO_STR: 1, STR_TO_NUM: 1, IS_NUM: 1,
          EOF: 1,
        }
        const upperName = expr.name.toUpperCase()
        if (builtins.has(upperName) && upperName in BUILTIN_ARITY) {
          // eslint-disable-next-line security/detect-object-injection
          const arity = BUILTIN_ARITY[upperName]
          const [minArgs, maxArgs] = Array.isArray(arity) ? arity : [arity, arity]
          if (expr.args.length < minArgs || expr.args.length > maxArgs) {
            const expected = minArgs === maxArgs ? String(minArgs) : `${minArgs}–${maxArgs}`
            error(expr.line, expr.column,
              `'${expr.name}' expects ${expected} argument(s) but got ${expr.args.length}`)
          }
        }
        expr.args.forEach((a) => checkExpr(a, scope, context))
        break
      }
      case 'Literal':
        break
    }
  }

  function checkAssignTarget(stmt: AssignStatement, scope: Scope, context: ValidationContext) {
    const target = stmt.target
    if (target.kind === 'Identifier') {
      const sym = scope.lookup(target.name)
      if (!sym) {
        error(target.line, target.column, `Variable '${target.name}' used before declaration`)
      } else if (sym.kind === 'constant') {
        error(target.line, target.column, `Cannot assign to constant '${target.name}'`)
      }
    } else if (target.kind === 'ArrayAccess') {
      const sym = scope.lookup(target.name)
      if (!sym) error(target.line, target.column, `Array '${target.name}' used before declaration`)
      target.indices.forEach((idx) => checkExpr(idx, scope, context))
    } else if (target.kind === 'RecordAccess') {
      const sym = scope.lookup(target.record)
      if (!sym) error(target.line, target.column, `Variable '${target.record}' used before declaration`)
      else if (sym.dataType?.kind === 'NamedType') {
        const typeSym = scope.lookup(sym.dataType.name)
        if (typeSym?.kind === 'type' && typeSym.fields && !typeSym.fields.includes(target.field)) {
          error(target.line, target.column, `Field '${target.field}' does not exist in type '${sym.dataType.name}'`)
        }
      }
    }
  }

  function checkStatements(stmts: Statement[], scope: Scope, context: ValidationContext) {
    for (const stmt of stmts) {
      checkStatement(stmt, scope, context)
    }
  }

  function checkStatement(stmt: Statement, scope: Scope, context: ValidationContext) {
    switch (stmt.kind) {
      case 'InputStatement': {
        const sym = scope.lookup(stmt.target)
        if (!sym) {
          error(stmt.line, stmt.column, `Variable '${stmt.target}' used before declaration`)
        }
        break
      }

      case 'OutputStatement':
        stmt.values.forEach((v) => checkExpr(v, scope, context))
        break

      case 'AssignStatement':
        checkAssignTarget(stmt, scope, context)
        checkExpr(stmt.value, scope, context)
        break

      case 'IfStatement': {
        const s = stmt as IfStatement
        checkExpr(s.condition, scope, context)
        const thenScope = new Scope(scope)
        checkStatements(s.thenBranch, thenScope, context)
        const elseScope = new Scope(scope)
        checkStatements(s.elseBranch, elseScope, context)
        break
      }

      case 'CaseStatement': {
        const s = stmt as CaseStatement
        checkExpr(s.subject, scope, context)
        s.clauses.forEach((c) => {
          checkExpr(c.value, scope, context)
          checkStatements(c.body, new Scope(scope), context)
        })
        checkStatements(s.otherwise, new Scope(scope), context)
        break
      }

      case 'ForStatement': {
        const s = stmt as ForStatement
        checkExpr(s.from, scope, context)
        checkExpr(s.to, scope, context)
        if (s.step) checkExpr(s.step, scope, context)
        const forScope = new Scope(scope)
        forScope.define({ kind: 'variable', name: s.variable })
        checkStatements(s.body, forScope, context)
        break
      }

      case 'WhileStatement': {
        const s = stmt as WhileStatement
        checkExpr(s.condition, scope, context)
        checkStatements(s.body, new Scope(scope), context)
        break
      }

      case 'RepeatStatement': {
        const s = stmt as RepeatStatement
        checkStatements(s.body, new Scope(scope), context)
        checkExpr(s.condition, scope, context)
        break
      }

      case 'DeclareStatement': {
        const s = stmt as DeclareStatement
        checkDataType(s.dataType, scope, s.line, s.column)
        if (!scope.define({ kind: 'variable', name: s.name, dataType: s.dataType })) {
          error(s.line, s.column, `Variable '${s.name}' is already declared in this scope`)
        }
        break
      }

      case 'ConstantStatement': {
        const s = stmt as ConstantStatement
        if (!scope.define({ kind: 'constant', name: s.name })) {
          error(s.line, s.column, `Constant '${s.name}' is already declared`)
        }
        checkExpr(s.value, scope, context)
        break
      }

      case 'TypeDecl': {
        const s = stmt as TypeDecl
        if (!scope.define({ kind: 'type', name: s.name, fields: s.fields.map((f) => f.name) })) {
          error(s.line, s.column, `Type '${s.name}' is already declared`)
        }
        break
      }

      case 'ProcedureDecl': {
        const s = stmt as ProcedureDecl
        if (!scope.define({ kind: 'procedure', name: s.name, paramCount: s.params.length })) {
          error(s.line, s.column, `Procedure '${s.name}' is already declared`)
        }
        const procScope = new Scope(scope)
        s.params.forEach((p) => {
          checkDataType(p.dataType, scope, s.line, s.column)
          procScope.define({ kind: 'variable', name: p.name, dataType: p.dataType })
        })
        checkStatements(s.body, procScope, 'procedure')
        break
      }

      case 'FunctionDecl': {
        const s = stmt as FunctionDecl
        if (!scope.define({ kind: 'function', name: s.name, paramCount: s.params.length })) {
          error(s.line, s.column, `Function '${s.name}' is already declared`)
        }
        const fnScope = new Scope(scope)
        s.params.forEach((p) => {
          checkDataType(p.dataType, scope, s.line, s.column)
          fnScope.define({ kind: 'variable', name: p.name, dataType: p.dataType })
        })
        checkStatements(s.body, fnScope, 'function')
        break
      }

      case 'CallStatement': {
        const s = stmt as CallStatement
        const sym = scope.lookup(s.name)
        if (!sym) {
          error(s.line, s.column, `Procedure '${s.name}' is not defined`)
        } else if (sym.kind !== 'procedure') {
          error(s.line, s.column, `'${s.name}' is not a procedure`)
        } else if (sym.paramCount !== undefined && s.args.length !== sym.paramCount) {
          error(s.line, s.column, `Procedure '${s.name}' expects ${sym.paramCount} argument(s) but got ${s.args.length}`)
        }
        s.args.forEach((a) => checkExpr(a, scope, context))
        break
      }

      case 'ReturnStatement': {
        if (context === 'global') {
          error(stmt.line, stmt.column, 'RETURN can only be used inside a FUNCTION or PROCEDURE')
        } else if (context === 'procedure' && stmt.value !== null) {
          error(stmt.line, stmt.column, 'RETURN with a value can only be used inside a FUNCTION')
        } else if (context === 'function' && stmt.value === null) {
          error(stmt.line, stmt.column, 'FUNCTION RETURN must include a value')
        }
        if (stmt.value) checkExpr(stmt.value, scope, context)
        break
      }

      case 'OpenFileStatement': {
        const s = stmt as OpenFileStatement
        checkExpr(s.file, scope, context)
        break
      }

      case 'ReadFileStatement': {
        const s = stmt as ReadFileStatement
        checkExpr(s.file, scope, context)
        const sym = scope.lookup(s.variable)
        if (!sym) error(s.line, s.column, `Variable '${s.variable}' used before declaration`)
        break
      }

      case 'WriteFileStatement': {
        const s = stmt as WriteFileStatement
        checkExpr(s.file, scope, context)
        checkExpr(s.value, scope, context)
        break
      }

      case 'CloseFileStatement':
        checkExpr(stmt.file, scope, context)
        break
    }
  }

  checkStatements(program.body, globalScope, 'global')
  return errors
}