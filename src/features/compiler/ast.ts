// Base for every AST node
export interface Node {
  line: number
  column: number
}

// ── Expressions ──────────────────────────────────────────────────────────────

export type BinaryOperator =
  | '+' | '-' | '*' | '/' | 'DIV' | 'MOD' | '^'
  | '=' | '<>' | '<' | '>' | '<=' | '>='
  | 'AND' | 'OR' | '&'
export type UnaryOperator = '-' | 'NOT'

export type Expression =
  | Literal
  | Identifier
  | BinaryExpr
  | UnaryExpr
  | FunctionCall
  | ArrayAccess
  | RecordAccess

export interface Literal extends Node {
  kind: 'Literal'
  valueType: 'INTEGER' | 'REAL' | 'STRING' | 'BOOLEAN'
  value: string
}

export interface Identifier extends Node {
  kind: 'Identifier'
  name: string
}

export interface BinaryExpr extends Node {
  kind: 'BinaryExpr'
  operator: BinaryOperator
  left: Expression
  right: Expression
}

export interface UnaryExpr extends Node {
  kind: 'UnaryExpr'
  operator: UnaryOperator
  operand: Expression
}

export interface FunctionCall extends Node {
  kind: 'FunctionCall'
  name: string
  args: Expression[]
}

export interface ArrayAccess extends Node {
  kind: 'ArrayAccess'
  name: string
  indices: Expression[]
}

export interface RecordAccess extends Node {
  kind: 'RecordAccess'
  record: string
  field: string
}

// ── Statements ───────────────────────────────────────────────────────────────

export type Statement =
  | InputStatement
  | OutputStatement
  | AssignStatement
  | IfStatement
  | CaseStatement
  | ForStatement
  | WhileStatement
  | RepeatStatement
  | DeclareStatement
  | ConstantStatement
  | TypeDecl
  | ProcedureDecl
  | FunctionDecl
  | CallStatement
  | ReturnStatement
  | OpenFileStatement
  | ReadFileStatement
  | WriteFileStatement
  | CloseFileStatement

export interface InputStatement extends Node {
  kind: 'InputStatement'
  target: string
}

export interface OutputStatement extends Node {
  kind: 'OutputStatement'
  values: Expression[]
}

export interface AssignStatement extends Node {
  kind: 'AssignStatement'
  target: Identifier | ArrayAccess | RecordAccess
  value: Expression
}

export interface IfStatement extends Node {
  kind: 'IfStatement'
  condition: Expression
  thenBranch: Statement[]
  elseBranch: Statement[]
}

export interface CaseClause extends Node {
  value: Expression
  body: Statement[]
}

export interface CaseStatement extends Node {
  kind: 'CaseStatement'
  subject: Expression
  clauses: CaseClause[]
  otherwise: Statement[]
}

export interface ForStatement extends Node {
  kind: 'ForStatement'
  variable: string
  from: Expression
  to: Expression
  step: Expression | null
  body: Statement[]
}

export interface WhileStatement extends Node {
  kind: 'WhileStatement'
  condition: Expression
  body: Statement[]
}

export interface RepeatStatement extends Node {
  kind: 'RepeatStatement'
  body: Statement[]
  condition: Expression
}

export interface DeclareStatement extends Node {
  kind: 'DeclareStatement'
  name: string
  dataType: DataType
}

export interface ConstantStatement extends Node {
  kind: 'ConstantStatement'
  name: string
  value: Expression
}

export interface FieldDecl {
  name: string
  dataType: DataType
}

export interface TypeDecl extends Node {
  kind: 'TypeDecl'
  name: string
  fields: FieldDecl[]
}

export interface Parameter {
  name: string
  dataType: DataType
}

export interface ProcedureDecl extends Node {
  kind: 'ProcedureDecl'
  name: string
  params: Parameter[]
  body: Statement[]
}

export interface FunctionDecl extends Node {
  kind: 'FunctionDecl'
  name: string
  params: Parameter[]
  returnType: DataType
  body: Statement[]
}

export interface CallStatement extends Node {
  kind: 'CallStatement'
  name: string
  args: Expression[]
}

export interface ReturnStatement extends Node {
  kind: 'ReturnStatement'
  value: Expression | null
}

export interface OpenFileStatement extends Node {
  kind: 'OpenFileStatement'
  file: Expression
  mode: 'READ' | 'WRITE' | 'APPEND'
}

export interface ReadFileStatement extends Node {
  kind: 'ReadFileStatement'
  file: Expression
  variable: string
}

export interface WriteFileStatement extends Node {
  kind: 'WriteFileStatement'
  file: Expression
  value: Expression
}

export interface CloseFileStatement extends Node {
  kind: 'CloseFileStatement'
  file: Expression
}

// ── Data Types ───────────────────────────────────────────────────────────────

export type DataType =
  | PrimitiveType
  | ArrayType
  | NamedType

export interface PrimitiveType {
  kind: 'PrimitiveType'
  name: 'BOOLEAN' | 'CHAR' | 'INTEGER' | 'REAL' | 'STRING' | 'DATE'
}

export interface ArrayType {
  kind: 'ArrayType'
  bounds: { lower: Expression; upper: Expression }[]
  elementType: PrimitiveType | NamedType
}

export interface NamedType {
  kind: 'NamedType'
  name: string
}

// ── Program ──────────────────────────────────────────────────────────────────

export interface Program extends Node {
  kind: 'Program'
  body: Statement[]
}