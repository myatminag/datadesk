import { z } from "zod"

export const DIALECTS = ["postgres", "mysql", "sqlite"] as const
export type Dialect = (typeof DIALECTS)[number]

export const REFERENTIAL_ACTIONS = [
  "cascade",
  "restrict",
  "set null",
  "no action",
] as const
export type ReferentialAction = (typeof REFERENTIAL_ACTIONS)[number]

export const RELATION_TYPES = ["oneToOne", "oneToMany", "manyToMany"] as const
export type RelationType = (typeof RELATION_TYPES)[number]

export const columnSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.string().min(1),
  nullable: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  isAutoIncrement: z.boolean().default(false),
  default: z.string().optional(),
  note: z.string().optional(),
})
export type Column = z.infer<typeof columnSchema>

export const tableSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  columns: z.array(columnSchema),
  position: z.object({ x: z.number(), y: z.number() }),
  color: z.string().optional(),
  note: z.string().optional(),
})
export type Table = z.infer<typeof tableSchema>

export const relationSchema = z.object({
  id: z.string(),
  fromTableId: z.string(),
  fromColumnId: z.string(),
  toTableId: z.string(),
  toColumnId: z.string(),
  type: z.enum(RELATION_TYPES).default("oneToMany"),
  onDelete: z.enum(REFERENTIAL_ACTIONS).optional(),
  onUpdate: z.enum(REFERENTIAL_ACTIONS).optional(),
  name: z.string().optional(),
})
export type Relation = z.infer<typeof relationSchema>

export const diagramSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  dialect: z.enum(DIALECTS).default("postgres"),
  tables: z.array(tableSchema),
  relations: z.array(relationSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Diagram = z.infer<typeof diagramSchema>

export const COLUMN_TYPE_PRESETS = {
  postgres: [
    "serial",
    "bigserial",
    "integer",
    "bigint",
    "smallint",
    "numeric",
    "real",
    "double precision",
    "boolean",
    "text",
    "varchar(255)",
    "char(1)",
    "uuid",
    "date",
    "time",
    "timestamp",
    "timestamptz",
    "json",
    "jsonb",
    "bytea",
  ],
  mysql: [
    "int",
    "int unsigned",
    "bigint",
    "tinyint",
    "smallint",
    "decimal(10,2)",
    "float",
    "double",
    "boolean",
    "text",
    "varchar(255)",
    "char(1)",
    "date",
    "datetime",
    "timestamp",
    "time",
    "json",
    "blob",
  ],
  sqlite: ["integer", "real", "text", "blob", "numeric", "boolean", "datetime"],
} as const satisfies Record<Dialect, readonly string[]>
