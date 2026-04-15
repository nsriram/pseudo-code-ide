// ── Runtime types ─────────────────────────────────────────────────────────────

export type PseudoValue = number | boolean | string | PseudoArray

export interface PseudoArray {
  readonly kind: 'array'
  data: Map<string, PseudoValue>
}

export interface PseudoCallable {
  readonly kind: 'callable'
  readonly type: 'procedure' | 'function'
  readonly params: { name: string }[]
  readonly body: import('./ast').Statement[]
  readonly closure: Environment
}

// ── Control-flow signals ──────────────────────────────────────────────────────

export class ReturnSignal {
  readonly value: PseudoValue
  constructor(value: PseudoValue) { this.value = value }
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RuntimeError'
  }
}

// ── Environment ───────────────────────────────────────────────────────────────

export class Environment {
  private readonly values = new Map<string, { value: PseudoValue; constant: boolean }>()
  private readonly parent: Environment | null

  constructor(parent: Environment | null = null) { this.parent = parent }

  define(name: string, value: PseudoValue, constant = false): void {
    this.values.set(name.toUpperCase(), { value, constant })
  }

  get(name: string): PseudoValue {
    const key = name.toUpperCase()
    const entry = this.values.get(key)
    if (entry !== undefined) return entry.value
    if (this.parent) return this.parent.get(name)
    throw new RuntimeError(`'${name}' is not defined`)
  }

  set(name: string, value: PseudoValue): void {
    const key = name.toUpperCase()
    if (this.values.has(key)) {
      const entry = this.values.get(key)!
      if (entry.constant) throw new RuntimeError(`Cannot assign to constant '${name}'`)
      this.values.set(key, { value, constant: false })
      return
    }
    if (this.parent && this.parent.has(name)) {
      this.parent.set(name, value)
      return
    }
    // Define on first use (handles loop variables and implicit declarations)
    this.values.set(key, { value, constant: false })
  }

  has(name: string): boolean {
    const key = name.toUpperCase()
    return this.values.has(key) || (this.parent?.has(name) ?? false)
  }
}

// ── Runtime I/O ───────────────────────────────────────────────────────────────

export class Runtime {
  private readonly inputQueue: string[]
  private readonly outputLines: string[] = []
  readonly maxSteps: number
  public steps = 0

  constructor(inputs: string[] = [], maxSteps = 100_000) {
    this.inputQueue = [...inputs]
    this.maxSteps = maxSteps
  }

  tick(): void {
    if (++this.steps > this.maxSteps) {
      throw new RuntimeError('Step limit exceeded — check for infinite loops')
    }
  }

  readInput(): string {
    if (this.inputQueue.length === 0) {
      throw new RuntimeError('Program requested more inputs than were provided')
    }
    return this.inputQueue.shift()!
  }

  writeOutput(value: string): void {
    this.outputLines.push(value)
  }

  getOutput(): string {
    return this.outputLines.join('\n')
  }
}