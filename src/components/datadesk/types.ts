export type DatabaseEngine = "postgres" | "mysql" | "sqlite" | "mssql" | "redis"

export type ConnectionStatus = "connected" | "idle" | "disconnected" | "error"

export interface Column {
  name: string
  type: string
  isPrimary?: boolean
  isNullable?: boolean
  isForeign?: boolean
  references?: string
}

export interface TableSchema {
  name: string
  kind: "table" | "view" | "procedure"
  columns: Array<Column>
  rowCount: number
}

export interface Connection {
  id: string
  name: string
  engine: DatabaseEngine
  host: string
  database: string
  status: ConnectionStatus
  tables: Array<TableSchema>
}

export type TabKind = "table" | "query"

export interface TableTab {
  id: string
  kind: "table"
  connectionId: string
  tableName: string
}

export interface QueryTab {
  id: string
  kind: "query"
  connectionId: string
  title: string
  sql: string
}

export type Tab = TableTab | QueryTab

export interface Row {
  id: string
  values: Record<string, string | number | null | boolean>
}

export interface QueryResult {
  columns: Array<{ name: string; type: string }>
  rows: Array<Row>
  elapsedMs: number
  error?: string
}
