import type { Connection, QueryResult, Row, TableSchema } from "./types"

const usersColumns = [
  { name: "id", type: "uuid", isPrimary: true },
  { name: "email", type: "text" },
  { name: "full_name", type: "text" },
  { name: "role", type: "text" },
  { name: "is_verified", type: "bool" },
  { name: "last_login_at", type: "timestamptz", isNullable: true },
  { name: "created_at", type: "timestamptz" },
]

const ordersColumns = [
  { name: "id", type: "uuid", isPrimary: true },
  { name: "user_id", type: "uuid", isForeign: true, references: "users.id" },
  { name: "status", type: "text" },
  { name: "total", type: "numeric" },
  { name: "currency", type: "text" },
  { name: "placed_at", type: "timestamptz" },
]

const productsColumns = [
  { name: "id", type: "uuid", isPrimary: true },
  { name: "sku", type: "text" },
  { name: "name", type: "text" },
  { name: "price", type: "numeric" },
  { name: "stock", type: "int4" },
  { name: "archived", type: "bool" },
]

const sessionsColumns = [
  { name: "id", type: "uuid", isPrimary: true },
  { name: "user_id", type: "uuid", isForeign: true, references: "users.id" },
  { name: "user_agent", type: "text" },
  { name: "ip", type: "inet" },
  { name: "expires_at", type: "timestamptz" },
]

const auditColumns = [
  { name: "id", type: "bigint", isPrimary: true },
  { name: "actor_id", type: "uuid", isNullable: true },
  { name: "action", type: "text" },
  { name: "payload", type: "jsonb" },
  { name: "occurred_at", type: "timestamptz" },
]

const prodTables: Array<TableSchema> = [
  { name: "users", kind: "table", columns: usersColumns, rowCount: 128_402 },
  {
    name: "orders",
    kind: "table",
    columns: ordersColumns,
    rowCount: 3_214_887,
  },
  {
    name: "products",
    kind: "table",
    columns: productsColumns,
    rowCount: 4_812,
  },
  {
    name: "sessions",
    kind: "table",
    columns: sessionsColumns,
    rowCount: 92_145,
  },
  {
    name: "audit_log",
    kind: "table",
    columns: auditColumns,
    rowCount: 12_004_221,
  },
  {
    name: "active_users",
    kind: "view",
    columns: usersColumns.slice(0, 4),
    rowCount: 4_321,
  },
  {
    name: "recent_orders",
    kind: "view",
    columns: ordersColumns,
    rowCount: 12_401,
  },
  {
    name: "refresh_user_roles",
    kind: "procedure",
    columns: [],
    rowCount: 0,
  },
]

const stagingTables: Array<TableSchema> = [
  { name: "users", kind: "table", columns: usersColumns, rowCount: 812 },
  { name: "orders", kind: "table", columns: ordersColumns, rowCount: 2_104 },
  {
    name: "feature_flags",
    kind: "table",
    columns: [
      { name: "key", type: "text", isPrimary: true },
      { name: "enabled", type: "bool" },
      { name: "rollout", type: "int4" },
    ],
    rowCount: 24,
  },
]

const analyticsTables: Array<TableSchema> = [
  {
    name: "events",
    kind: "table",
    columns: [
      { name: "id", type: "uuid", isPrimary: true },
      { name: "name", type: "text" },
      {
        name: "user_id",
        type: "uuid",
        isForeign: true,
        references: "users.id",
      },
      { name: "properties", type: "jsonb" },
      { name: "at", type: "timestamptz" },
    ],
    rowCount: 88_402_194,
  },
  {
    name: "sessions_daily",
    kind: "view",
    columns: [
      { name: "day", type: "date" },
      { name: "sessions", type: "int8" },
      { name: "unique_users", type: "int8" },
    ],
    rowCount: 540,
  },
]

export const mockConnections: Array<Connection> = [
  {
    id: "conn-prod",
    name: "production",
    engine: "postgres",
    host: "db.prod.internal:5432",
    database: "shop_prod",
    status: "connected",
    tables: prodTables,
  },
  {
    id: "conn-staging",
    name: "staging",
    engine: "postgres",
    host: "db.staging.internal:5432",
    database: "shop_staging",
    status: "idle",
    tables: stagingTables,
  },
  {
    id: "conn-analytics",
    name: "analytics",
    engine: "mysql",
    host: "analytics.eu-west-1.rds:3306",
    database: "events",
    status: "disconnected",
    tables: analyticsTables,
  },
  {
    id: "conn-local",
    name: "local sqlite",
    engine: "sqlite",
    host: "~/workspace/app.db",
    database: "app",
    status: "idle",
    tables: [
      {
        name: "cache",
        kind: "table",
        columns: [
          { name: "key", type: "text", isPrimary: true },
          { name: "value", type: "blob" },
          { name: "expires_at", type: "int8", isNullable: true },
        ],
        rowCount: 184,
      },
    ],
  },
]

const firstNames = [
  "Ada",
  "Grace",
  "Linus",
  "Margaret",
  "Barbara",
  "Dennis",
  "Ken",
  "Alan",
  "Anita",
  "Hedy",
  "Donald",
  "Joan",
  "Radia",
  "Vint",
  "Tim",
]
const lastNames = [
  "Lovelace",
  "Hopper",
  "Torvalds",
  "Hamilton",
  "Liskov",
  "Ritchie",
  "Thompson",
  "Turing",
  "Borg",
  "Lamarr",
  "Knuth",
  "Clarke",
  "Perlman",
  "Cerf",
  "Berners-Lee",
]

function pick<T>(arr: Array<T>, i: number): T {
  return arr[i % arr.length]
}

export function generateUserRows(count: number): Array<Row> {
  const rows: Array<Row> = []
  for (let i = 0; i < count; i++) {
    const first = pick(firstNames, i)
    const last = pick(lastNames, i + 3)
    const fullName = `${first} ${last}`
    rows.push({
      id: `u-${i + 1}`,
      values: {
        id: `7a${(i + 10).toString(16).padStart(6, "0")}-4f2b-8c1e-${(i * 7)
          .toString(16)
          .padStart(4, "0")}`,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@example.com`,
        full_name: fullName,
        role: i % 9 === 0 ? "admin" : i % 4 === 0 ? "moderator" : "member",
        is_verified: i % 3 !== 0,
        last_login_at:
          i % 11 === 0
            ? null
            : new Date(Date.now() - i * 43_000_000).toISOString(),
        created_at: new Date(Date.now() - (i + 1) * 96_000_000).toISOString(),
      },
    })
  }
  return rows
}

export const mockQueryResult: QueryResult = {
  columns: [
    { name: "role", type: "text" },
    { name: "users", type: "int8" },
    { name: "verified_pct", type: "numeric" },
    { name: "last_signup", type: "timestamptz" },
  ],
  rows: [
    {
      id: "r1",
      values: {
        role: "admin",
        users: 14,
        verified_pct: 1,
        last_signup: "2026-03-12 09:42:01+00",
      },
    },
    {
      id: "r2",
      values: {
        role: "moderator",
        users: 128,
        verified_pct: 0.94,
        last_signup: "2026-04-18 22:11:44+00",
      },
    },
    {
      id: "r3",
      values: {
        role: "member",
        users: 128_260,
        verified_pct: 0.81,
        last_signup: "2026-04-22 14:03:22+00",
      },
    },
  ],
  elapsedMs: 42,
}

export const sampleQuery = `-- Breakdown of users by role
select
  role,
  count(*)                        as users,
  avg(case when is_verified then 1.0 else 0.0 end) as verified_pct,
  max(created_at)                 as last_signup
from users
where created_at > now() - interval '90 days'
group by role
order by users desc;`
