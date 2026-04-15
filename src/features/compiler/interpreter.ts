import type {
  Program, Statement, Expression,
  AssignStatement, IfStatement, CaseStatement,
  ForStatement, WhileStatement, RepeatStatement,
  ProcedureDecl, FunctionDecl, CallStatement,
} from './ast'
import {
  Environment, Runtime, ReturnSignal, RuntimeError,
  type PseudoValue, type PseudoCallable, type PseudoRecord,
} from './runtime'

// ── Expression evaluation ─────────────────────────────────────────────────────

function evalExpr(expr: Expression, env: Environment, rt: Runtime): PseudoValue {
  switch (expr.kind) {
    case 'Literal': {
      switch (expr.valueType) {
        case 'INTEGER': return parseInt(expr.value, 10)
        case 'REAL': return parseFloat(expr.value)
        case 'BOOLEAN': return expr.value.toUpperCase() === 'TRUE'
        case 'STRING': return expr.value
      }
      break
    }

    case 'Identifier': {
      const val = env.get(expr.name)
      // PseudoCallable is stored in env but is not a PseudoValue — guard against it
      if (val !== null && typeof val === 'object' && 'kind' in val && (val as unknown as PseudoCallable).kind === 'callable') {
        throw new RuntimeError(`'${expr.name}' is a procedure/function, not a value`)
      }
      return val as PseudoValue
    }

    case 'ArrayAccess': {
      const arr = env.get(expr.name)
      if (arr === null || typeof arr !== 'object' || (arr as { kind: string }).kind !== 'array') {
        throw new RuntimeError(`'${expr.name}' is not an array`)
      }
      const pseudoArr = arr as import('./runtime').PseudoArray
      const key = expr.indices.map((i) => String(evalExpr(i, env, rt))).join('\x00')
      return pseudoArr.data.get(key) ?? 0
    }

    case 'RecordAccess': {
      const rec = env.get(expr.record)
      if (rec === null || typeof rec !== 'object' || (rec as { kind: string }).kind !== 'record') {
        throw new RuntimeError(`'${expr.record}' is not a record`)
      }
      const pseudoRec = rec as PseudoRecord
      return pseudoRec.data.get(expr.field) ?? 0
    }

    case 'BinaryExpr': {
      const op = expr.operator
      // Short-circuit logical operators
      if (op === 'AND') {
        const l = evalExpr(expr.left, env, rt)
        return l === false ? false : evalExpr(expr.right, env, rt)
      }
      if (op === 'OR') {
        const l = evalExpr(expr.left, env, rt)
        return l !== false ? l : evalExpr(expr.right, env, rt)
      }
      const left = evalExpr(expr.left, env, rt)
      const right = evalExpr(expr.right, env, rt)
      switch (op) {
        case '+':
          if (typeof left === 'string' || typeof right === 'string')
            return String(left) + String(right)
          return (left as number) + (right as number)
        case '-': return (left as number) - (right as number)
        case '*': return (left as number) * (right as number)
        case '/': {
          if ((right as number) === 0) throw new RuntimeError('Division by zero')
          return (left as number) / (right as number)
        }
        case 'DIV': {
          if ((right as number) === 0) throw new RuntimeError('Division by zero')
          return Math.trunc((left as number) / (right as number))
        }
        case 'MOD': return (left as number) % (right as number)
        case '^': return Math.pow(left as number, right as number)
        case '=': return left === right
        case '<>': return left !== right
        case '<': return (left as number) < (right as number)
        case '>': return (left as number) > (right as number)
        case '<=': return (left as number) <= (right as number)
        case '>=': return (left as number) >= (right as number)
        case '&': return String(left) + String(right)
        default: throw new RuntimeError(`Unknown operator '${op}'`)
      }
    }

    case 'UnaryExpr': {
      const operand = evalExpr(expr.operand, env, rt)
      switch (expr.operator) {
        case '-': return -(operand as number)
        case 'NOT': return !operand
      }
      break
    }

    case 'FunctionCall': {
      rt.tick()
      const name = expr.name.toUpperCase()
      const args = expr.args.map((a) => evalExpr(a, env, rt))

      // Built-in functions
      switch (name) {
        case 'LENGTH': return String(args[0]).length
        case 'LEFT': return String(args[0]).slice(0, args[1] as number)
        case 'RIGHT': {
          const s = String(args[0])
          return s.slice(s.length - (args[1] as number))
        }
        case 'MID': return String(args[0]).slice((args[1] as number) - 1, (args[1] as number) - 1 + (args[2] as number))
        case 'ASC': return String(args[0]).charCodeAt(0)
        case 'CHR': return String.fromCharCode(args[0] as number)
        case 'INT': return Math.trunc(args[0] as number)
        case 'ROUND': return args.length > 1
          ? Number((args[0] as number).toFixed(args[1] as number))
          : Math.round(args[0] as number)
        case 'UCASE': return String(args[0]).toUpperCase()
        case 'LCASE': return String(args[0]).toLowerCase()
        case 'NUM_TO_STR': return String(args[0])
        case 'STR_TO_NUM': return Number(args[0])
        case 'IS_NUM': return !isNaN(Number(args[0]))
        case 'EOF': return false  // no real file I/O in simulator
        default: break
      }

      // User-defined functions
      const sym = env.get(expr.name)
      if (sym === null || typeof sym !== 'object' || (sym as { kind: string }).kind !== 'callable') {
        throw new RuntimeError(`Function '${expr.name}' is not defined`)
      }
      const callable = sym as unknown as PseudoCallable
      if (callable.type !== 'function') {
        throw new RuntimeError(`'${expr.name}' is a procedure, not a function`)
      }
      const fnEnv = new Environment(callable.closure)
      callable.params.forEach((p, i) => fnEnv.define(p.name, args[i] ?? 0))
      try {
        executeStatements(callable.body, fnEnv, rt)
      } catch (e) {
        if (e instanceof ReturnSignal) {
          if (e.value === null) throw new RuntimeError(`Function '${expr.name}' did not return a value`)
          return e.value
        }
        throw e
      }
      throw new RuntimeError(`Function '${expr.name}' did not return a value`)
    }
  }
  // unreachable, but TypeScript needs it
  throw new RuntimeError('Unknown expression kind')
}

// ── Statement execution ───────────────────────────────────────────────────────

function executeStatements(stmts: Statement[], env: Environment, rt: Runtime): void {
  for (const stmt of stmts) {
    executeStatement(stmt, env, rt)
  }
}

function executeStatement(stmt: Statement, env: Environment, rt: Runtime): void {
  rt.tick()

  switch (stmt.kind) {
    case 'DeclareStatement': {
      // Initialise with a sensible default value
      let defaultVal: PseudoValue = 0
      if (stmt.dataType.kind === 'PrimitiveType') {
        const name = stmt.dataType.name
        if (name === 'STRING' || name === 'CHAR' || name === 'DATE') {
          defaultVal = ''
        } else if (name === 'BOOLEAN') {
          defaultVal = false
        }
        // INTEGER and REAL default to 0 (already set)
      } else if (stmt.dataType.kind === 'ArrayType') {
        defaultVal = { kind: 'array', data: new Map() }
      } else if (stmt.dataType.kind === 'NamedType') {
        defaultVal = { kind: 'record', data: new Map() }
      }
      env.define(stmt.name, defaultVal)
      break
    }

    case 'ConstantStatement': {
      const val = evalExpr(stmt.value, env, rt)
      env.define(stmt.name, val, true)
      break
    }

    case 'AssignStatement': {
      const s = stmt as AssignStatement
      const val = evalExpr(s.value, env, rt)
      const target = s.target
      if (target.kind === 'Identifier') {
        env.set(target.name, val)
      } else if (target.kind === 'ArrayAccess') {
        const arr = env.get(target.name)
        if (arr === null || typeof arr !== 'object' || (arr as { kind: string }).kind !== 'array') {
          throw new RuntimeError(`'${target.name}' is not an array`)
        }
        const key = target.indices.map((i) => String(evalExpr(i, env, rt))).join('\x00')
        ;(arr as import('./runtime').PseudoArray).data.set(key, val)
      } else {
        // RecordAccess
        const rec = env.get(target.record)
        if (rec === null || typeof rec !== 'object' || (rec as { kind: string }).kind !== 'record') {
          throw new RuntimeError(`'${target.record}' is not a record`)
        }
        ;(rec as PseudoRecord).data.set(target.field, val)
      }
      break
    }

    case 'InputStatement': {
      const raw = rt.readInput()
      const num = Number(raw)
      const val: PseudoValue = isNaN(num) ? raw : num
      env.set(stmt.target, val)
      break
    }

    case 'OutputStatement': {
      const parts = stmt.values.map((v) => pseudoToString(evalExpr(v, env, rt)))
      rt.writeOutput(parts.join(''))
      break
    }

    case 'IfStatement': {
      const s = stmt as IfStatement
      const cond = evalExpr(s.condition, env, rt)
      const branchEnv = new Environment(env)
      if (cond) {
        executeStatements(s.thenBranch, branchEnv, rt)
      } else {
        executeStatements(s.elseBranch, branchEnv, rt)
      }
      break
    }

    case 'CaseStatement': {
      const s = stmt as CaseStatement
      const subject = evalExpr(s.subject, env, rt)
      let matched = false
      for (const clause of s.clauses) {
        const val = evalExpr(clause.value, env, rt)
        if (subject === val) {
          executeStatements(clause.body, new Environment(env), rt)
          matched = true
          break
        }
      }
      if (!matched) {
        executeStatements(s.otherwise, new Environment(env), rt)
      }
      break
    }

    case 'ForStatement': {
      const s = stmt as ForStatement
      const from = evalExpr(s.from, env, rt) as number
      const to = evalExpr(s.to, env, rt) as number
      const step = s.step ? (evalExpr(s.step, env, rt) as number) : 1
      if (step === 0) throw new RuntimeError('FOR loop STEP value cannot be zero')
      const loopEnv = new Environment(env)
      loopEnv.define(s.variable, from)
      if (step > 0) {
        for (let i = from; i <= to; i += step) {
          rt.tick()
          loopEnv.set(s.variable, i)
          executeStatements(s.body, loopEnv, rt)
        }
      } else {
        for (let i = from; i >= to; i += step) {
          rt.tick()
          loopEnv.set(s.variable, i)
          executeStatements(s.body, loopEnv, rt)
        }
      }
      break
    }

    case 'WhileStatement': {
      const s = stmt as WhileStatement
      while (evalExpr(s.condition, env, rt)) {
        rt.tick()
        executeStatements(s.body, new Environment(env), rt)
      }
      break
    }

    case 'RepeatStatement': {
      const s = stmt as RepeatStatement
      do {
        rt.tick()
        executeStatements(s.body, new Environment(env), rt)
      } while (!evalExpr(s.condition, env, rt))
      break
    }

    case 'ProcedureDecl': {
      const s = stmt as ProcedureDecl
      const callable: PseudoCallable = {
        kind: 'callable',
        type: 'procedure',
        params: s.params.map((p) => ({ name: p.name })),
        body: s.body,
        closure: env,
      }
      env.define(s.name, callable as unknown as PseudoValue)
      break
    }

    case 'FunctionDecl': {
      const s = stmt as FunctionDecl
      const callable: PseudoCallable = {
        kind: 'callable',
        type: 'function',
        params: s.params.map((p) => ({ name: p.name })),
        body: s.body,
        closure: env,
      }
      env.define(s.name, callable as unknown as PseudoValue)
      break
    }

    case 'CallStatement': {
      const s = stmt as CallStatement
      const sym = env.get(s.name)
      if (sym === null || typeof sym !== 'object' || (sym as { kind: string }).kind !== 'callable') {
        throw new RuntimeError(`Procedure '${s.name}' is not defined`)
      }
      const callable = sym as unknown as PseudoCallable
      const args = s.args.map((a) => evalExpr(a, env, rt))
      const procEnv = new Environment(callable.closure)
      callable.params.forEach((p, i) => procEnv.define(p.name, args[i] ?? 0))
      try {
        executeStatements(callable.body, procEnv, rt)
      } catch (e) {
        if (e instanceof ReturnSignal) break  // procedures can exit early via RETURN (no value used)
        throw e
      }
      break
    }

    case 'ReturnStatement':
      throw new ReturnSignal(stmt.value !== null ? evalExpr(stmt.value, env, rt) : null)

    case 'TypeDecl':
    case 'OpenFileStatement':
    case 'ReadFileStatement':
    case 'WriteFileStatement':
    case 'CloseFileStatement':
      // File I/O and type declarations are silently ignored in the simulator
      break
  }
}

function pseudoToString(val: PseudoValue): string {
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'object' && val.kind === 'array') return '[array]'
  if (typeof val === 'object' && val.kind === 'record') {
    const fields = [...val.data.entries()].map(([k, v]) => `${k}: ${pseudoToString(v)}`).join(', ')
    return `{${fields}}`
  }
  return String(val)
}

// ── Public entry point ────────────────────────────────────────────────────────

export function interpret(program: Program, inputs: string[] = []): { output: string; error: string | null } {
  const rt = new Runtime(inputs)
  const env = new Environment()
  try {
    executeStatements(program.body, env, rt)
    return { output: rt.getOutput(), error: null }
  } catch (e) {
    if (e instanceof RuntimeError) return { output: rt.getOutput(), error: e.message }
    if (e instanceof ReturnSignal) return { output: rt.getOutput(), error: null }
    return { output: rt.getOutput(), error: String(e) }
  }
}