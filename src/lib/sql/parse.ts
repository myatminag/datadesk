import pkg from "node-sql-parser"

import { createId } from "@/lib/id"

const { Parser } = pkg
import type { Column, Dialect, Relation, Table } from "@/lib/types"

export interface ParseResult {
  tables: Table[]
  relations: Relation[]
  warnings: string[]
}

const DIALECT_TO_DB: Record<Dialect, string> = {
  postgres: "postgresql",
  mysql: "mysql",
  sqlite: "sqlite",
}

function readColumnName(val: unknown): string | undefined {
  if (typeof val === "string") return val
  if (val && typeof val === "object") {
    const v = val as { column?: unknown; expr?: { value?: string } }
    if (typeof v.column === "string") return v.column
    if (v.expr?.value) return v.expr.value
  }
  return undefined
}

function readTableName(val: unknown): string | undefined {
  if (!val) return undefined
  if (typeof val === "string") return val
  if (Array.isArray(val) && val.length > 0) {
    const first = val[0] as { table?: string }
    return first.table
  }
  if (typeof val === "object") {
    const v = val as { table?: string }
    return v.table
  }
  return undefined
}

function stringifyType(dataType: unknown): string {
  if (!dataType) return "text"
  if (typeof dataType === "string") return dataType.toLowerCase()
  if (typeof dataType === "object") {
    const d = dataType as {
      dataType?: string
      length?: number
      scale?: number
      parentheses?: boolean
      suffix?: string[]
    }
    const base = (d.dataType ?? "text").toLowerCase()
    if (d.length != null && d.scale != null)
      return `${base}(${d.length},${d.scale})`
    if (d.length != null) return `${base}(${d.length})`
    if (d.suffix && d.suffix.length) return `${base} ${d.suffix.join(" ")}`
    return base
  }
  return "text"
}

function gridPosition(index: number): { x: number; y: number } {
  const cols = 4
  return {
    x: 80 + (index % cols) * 320,
    y: 80 + Math.floor(index / cols) * 260,
  }
}

export function parseSql(dialect: Dialect, sql: string): ParseResult {
  const warnings: string[] = []
  const tables: Table[] = []
  const relations: Relation[] = []
  const tableByName = new Map<string, Table>()

  const parser = new Parser()
  let ast: unknown
  try {
    ast = parser.astify(sql, { database: DIALECT_TO_DB[dialect] })
  } catch (err) {
    warnings.push(`Parse error: ${(err as Error).message}`)
    return { tables, relations, warnings }
  }

  const statements = Array.isArray(ast) ? ast : [ast]

  let tableIndex = 0
  for (const stmtRaw of statements) {
    const stmt = stmtRaw as {
      type?: string
      keyword?: string
      table?: unknown
      create_definitions?: unknown[]
    }
    if (stmt.type !== "create" || stmt.keyword !== "table") continue

    const tableName = readTableName(stmt.table)
    if (!tableName) {
      warnings.push("Skipped a CREATE TABLE with no parseable name")
      continue
    }

    const columns: Column[] = []
    const primaryKeyNames: string[] = []
    const uniqueNames: string[] = []
    const fkDefs: Array<{
      fromColumns: string[]
      toTable: string
      toColumns: string[]
      onDelete?: string
      onUpdate?: string
      name?: string
    }> = []

    for (const defRaw of stmt.create_definitions ?? []) {
      const def = defRaw as {
        resource?: string
        column?: unknown
        definition?: unknown
        nullable?: { type?: string; value?: string }
        unique?: string | boolean
        primary_key?: string | boolean
        auto_increment?: string | boolean
        default_val?: { value?: unknown }
        constraint_type?: string
        columns?: unknown[]
        reference_definition?: {
          table?: unknown
          definition?: unknown[]
          on_delete?: { value?: string; type?: string }
          on_update?: { value?: string; type?: string }
        }
        constraint?: string
      }

      if (def.resource === "column") {
        const name = readColumnName(def.column)
        if (!name) continue
        const type = stringifyType(def.definition)
        const nullable = def.nullable?.type !== "not null"
        const isUnique = def.unique === "unique" || def.unique === true
        const isPrimary =
          def.primary_key === "primary key" || def.primary_key === true
        const isAutoIncrement =
          def.auto_increment === "auto_increment" || def.auto_increment === true
        let defaultVal: string | undefined
        if (def.default_val?.value !== undefined) {
          const v = def.default_val.value
          defaultVal = typeof v === "object" ? JSON.stringify(v) : String(v)
        }
        columns.push({
          id: createId("col"),
          name,
          type,
          nullable,
          isPrimary,
          isUnique,
          isAutoIncrement,
          default: defaultVal,
        })
      } else if (def.resource === "constraint") {
        const kind = def.constraint_type?.toLowerCase()
        const colNames = (def.columns ?? [])
          .map((c) => readColumnName(c))
          .filter((c): c is string => Boolean(c))
        if (kind === "primary key") {
          primaryKeyNames.push(...colNames)
        } else if (kind === "unique" || kind === "unique key") {
          uniqueNames.push(...colNames)
        } else if (kind === "foreign key" || kind === "fk") {
          const ref = def.reference_definition
          const toTable = readTableName(ref?.table)
          const toCols = (ref?.definition ?? [])
            .map((c) => readColumnName(c))
            .filter((c): c is string => Boolean(c))
          if (toTable && toCols.length && colNames.length) {
            fkDefs.push({
              fromColumns: colNames,
              toTable,
              toColumns: toCols,
              onDelete: ref?.on_delete?.value ?? ref?.on_delete?.type,
              onUpdate: ref?.on_update?.value ?? ref?.on_update?.type,
              name: def.constraint,
            })
          }
        }
      }
    }

    for (const c of columns) {
      if (primaryKeyNames.includes(c.name)) c.isPrimary = true
      if (uniqueNames.includes(c.name)) c.isUnique = true
    }

    const table: Table = {
      id: createId("tbl"),
      name: tableName,
      columns,
      position: gridPosition(tableIndex++),
    }
    tables.push(table)
    tableByName.set(tableName, table)
    // stash fkDefs on the table for a second pass
    ;(table as Table & { __fk?: typeof fkDefs }).__fk = fkDefs
  }

  for (const table of tables) {
    const fkDefs = (
      table as Table & {
        __fk?: Array<{
          fromColumns: string[]
          toTable: string
          toColumns: string[]
          onDelete?: string
          onUpdate?: string
          name?: string
        }>
      }
    ).__fk
    if (!fkDefs) continue
    for (const fk of fkDefs) {
      const toTable = tableByName.get(fk.toTable)
      if (!toTable) {
        warnings.push(
          `FK on ${table.name} references unknown table ${fk.toTable}`
        )
        continue
      }
      for (let i = 0; i < fk.fromColumns.length; i++) {
        const fromColName = fk.fromColumns[i]
        const toColName = fk.toColumns[i] ?? fk.toColumns[0]
        const fromCol = table.columns.find((c) => c.name === fromColName)
        const toCol = toTable.columns.find((c) => c.name === toColName)
        if (!fromCol || !toCol) {
          warnings.push(
            `FK on ${table.name}.${fromColName} could not resolve columns`
          )
          continue
        }
        relations.push({
          id: createId("rel"),
          fromTableId: table.id,
          fromColumnId: fromCol.id,
          toTableId: toTable.id,
          toColumnId: toCol.id,
          type:
            fromCol.isUnique || fromCol.isPrimary ? "oneToOne" : "oneToMany",
          onDelete: normalizeAction(fk.onDelete),
          onUpdate: normalizeAction(fk.onUpdate),
          name: fk.name,
        })
      }
    }
    delete (table as Table & { __fk?: unknown }).__fk
  }

  return { tables, relations, warnings }
}

function normalizeAction(
  v: string | undefined
): "cascade" | "restrict" | "set null" | "no action" | undefined {
  if (!v) return undefined
  const lower = v.toLowerCase()
  if (lower.includes("cascade")) return "cascade"
  if (lower.includes("restrict")) return "restrict"
  if (lower.includes("set null")) return "set null"
  if (lower.includes("no action")) return "no action"
  return undefined
}
