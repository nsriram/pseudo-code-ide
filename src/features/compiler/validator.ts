import type {
  Program, Statement, Expression, DataType,
  AssignStatement, IfStatement, CaseStatement,
  ForStatement, WhileStatement, RepeatStatement,
  DeclareStatement, ConstantStatement, TypeDecl,
  ProcedureDecl, FunctionDecl,
  CallStatement, ReturnStatement,
  OpenFileStatement, ReadFileStatement, WriteFileStatement,
} from './ast'

export interface ValidationError {
  line: number
  column: number
  message: string
}

type SymbolKind = 'variable' | 'constant' | 'procedure' | 'function' | 'type'

interface Symbol {
  kind: SymbolKind
  name: string
  dataType?: DataType
  paramCount?: number
}

class Scope {
  private symbols = new Map<string, Symbol>()
  private parent: Scope | null

  constructor(parent: Scope | null = null) {
    this.parent = parent
  }

  define(sym: Symbol): boolean {
    if (this.symbols.has(sym.name)) return false
    this.symbols.set(sym.name, sym)
    return true
  }

  lookup(name: string): Symbol | null {
    return this.symbols.get(name) ?? this.parent?.lookup(name) ?? null
  }

  has(name: string): boolean {
    return this.symbols.has(name)
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

  function checkExpr(expr: Expression, scope: Scope, insideFunction: boolean) {
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
        expr.indices.forEach((idx) => checkExpr(idx, scope, insideFunction))
        break
      }
      case 'RecordAccess': {
        const sym = scope.lookup(expr.record)
        if (!sym) {
          error(expr.line, expr.column, `Variable '${expr.record}' used before declaration`)
        }
        break
      }
      case 'BinaryExpr':
        checkExpr(expr.left, scope, insideFunction)
        checkExpr(expr.right, scope, insideFunction)
        break
      case 'UnaryExpr':
        checkExpr(expr.operand, scope, insideFunction)
        break
      case 'FunctionCall': {
        const sym = scope.lookup(expr.name)
        // Allow built-ins without declaration check
        const builtins = new Set(['LENGTH', 'LEFT', 'RIGHT', 'MID', 'ASC', 'EOF'])
        if (!builtins.has(expr.name.toUpperCase()) && !sym) {
          error(expr.line, expr.column, `Function '${expr.name}' is not defined`)
        }
        if (sym && sym.kind === 'function' && sym.paramCount !== undefined && expr.args.length !== sym.paramCount) {
          error(expr.line, expr.column, `Function '${expr.name}' expects ${sym.paramCount} argument(s) but got ${expr.args.length}`)
        }
        expr.args.forEach((a) => checkExpr(a, scope, insideFunction))
        break
      }
      case 'Literal':
        break
    }
  }

  function checkAssignTarget(stmt: AssignStatement, scope: Scope) {
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
      target.indices.forEach((idx) => checkExpr(idx, scope, false))
    } else if (target.kind === 'RecordAccess') {
      const sym = scope.lookup(target.record)
      if (!sym) error(target.line, target.column, `Variable '${target.record}' used before declaration`)
    }
  }

  function checkStatements(stmts: Statement[], scope: Scope, insideFunction: boolean) {
    for (const stmt of stmts) {
      checkStatement(stmt, scope, insideFunction)
    }
  }

  function checkStatement(stmt: Statement, scope: Scope, insideFunction: boolean) {
    switch (stmt.kind) {
      case 'InputStatement': {
        const sym = scope.lookup(stmt.target)
        if (!sym) {
          error(stmt.line, stmt.column, `Variable '${stmt.target}' used before declaration`)
        }
        break
      }

      case 'OutputStatement':
        stmt.values.forEach((v) => checkExpr(v, scope, insideFunction))
        break

      case 'AssignStatement':
        checkAssignTarget(stmt, scope)
        checkExpr(stmt.value, scope, insideFunction)
        break

      case 'IfStatement': {
        const s = stmt as IfStatement
        checkExpr(s.condition, scope, insideFunction)
        const thenScope = new Scope(scope)
        checkStatements(s.thenBranch, thenScope, insideFunction)
        const elseScope = new Scope(scope)
        checkStatements(s.elseBranch, elseScope, insideFunction)
        break
      }

      case 'CaseStatement': {
        const s = stmt as CaseStatement
        checkExpr(s.subject, scope, insideFunction)
        s.clauses.forEach((c) => {
          checkExpr(c.value, scope, insideFunction)
          checkStatements(c.body, new Scope(scope), insideFunction)
        })
        checkStatements(s.otherwise, new Scope(scope), insideFunction)
        break
      }

      case 'ForStatement': {
        const s = stmt as ForStatement
        checkExpr(s.from, scope, insideFunction)
        checkExpr(s.to, scope, insideFunction)
        if (s.step) checkExpr(s.step, scope, insideFunction)
        const forScope = new Scope(scope)
        forScope.define({ kind: 'variable', name: s.variable })
        checkStatements(s.body, forScope, insideFunction)
        break
      }

      case 'WhileStatement': {
        const s = stmt as WhileStatement
        checkExpr(s.condition, scope, insideFunction)
        checkStatements(s.body, new Scope(scope), insideFunction)
        break
      }

      case 'RepeatStatement': {
        const s = stmt as RepeatStatement
        checkStatements(s.body, new Scope(scope), insideFunction)
        checkExpr(s.condition, scope, insideFunction)
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
        checkExpr(s.value, scope, insideFunction)
        break
      }

      case 'TypeDecl': {
        const s = stmt as TypeDecl
        if (!scope.define({ kind: 'type', name: s.name })) {
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
        checkStatements(s.body, procScope, false)
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
        checkStatements(s.body, fnScope, true)
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
        s.args.forEach((a) => checkExpr(a, scope, insideFunction))
        break
      }

      case 'ReturnStatement': {
        const s = stmt as ReturnStatement
        if (!insideFunction) {
          error(s.line, s.column, 'RETURN can only be used inside a FUNCTION')
        }
        checkExpr(s.value, scope, insideFunction)
        break
      }

      case 'OpenFileStatement': {
        const s = stmt as OpenFileStatement
        checkExpr(s.file, scope, insideFunction)
        break
      }

      case 'ReadFileStatement': {
        const s = stmt as ReadFileStatement
        checkExpr(s.file, scope, insideFunction)
        const sym = scope.lookup(s.variable)
        if (!sym) error(s.line, s.column, `Variable '${s.variable}' used before declaration`)
        break
      }

      case 'WriteFileStatement': {
        const s = stmt as WriteFileStatement
        checkExpr(s.file, scope, insideFunction)
        checkExpr(s.value, scope, insideFunction)
        break
      }

      case 'CloseFileStatement':
        checkExpr(stmt.file, scope, insideFunction)
        break
    }
  }

  checkStatements(program.body, globalScope, false)
  return errors
}