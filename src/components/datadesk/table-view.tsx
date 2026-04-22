import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
  FilterIcon,
  KeyIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PlusIcon,
  RefreshCcwIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { generateUserRows, mockQueryResult } from "./mock-data"
import { ChromeButton } from "./top-bar"
import type { Connection, Row, TableSchema } from "./types"
import { cn } from "@/lib/utils"

interface TableViewProps {
  connection: Connection
  tableName: string
}

type SortDir = "asc" | "desc"

export function TableView({ connection, tableName }: TableViewProps) {
  const table = connection.tables.find((t) => t.name === tableName)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<{ col: string; dir: SortDir } | null>(null)
  const [dirty, setDirty] = useState<
    Record<string, Record<string, string | undefined>>
  >({})
  const [editing, setEditing] = useState<{ id: string; col: string } | null>(
    null
  )

  const rows = useMemo<Array<Row>>(() => {
    if (!table) return []
    if (table.name === "users") return generateUserRows(38)
    return mockQueryResult.rows
  }, [table])

  if (!table) {
    return (
      <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
        Table not found.
      </div>
    )
  }

  const displayRows = useMemo(() => {
    if (!sort) return rows
    const dir = sort.dir === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = a.values[sort.col]
      const bv = b.values[sort.col]
      if (av === bv) return 0
      if (av === null) return 1
      if (bv === null) return -1
      return av > bv ? dir : -dir
    })
  }, [rows, sort])

  function toggleSort(col: string) {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" }
      if (prev.dir === "asc") return { col, dir: "desc" }
      return null
    })
  }

  function toggleRow(id: string, e: React.MouseEvent) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (e.metaKey || e.ctrlKey) {
        if (next.has(id)) next.delete(id)
        else next.add(id)
      } else {
        if (next.size === 1 && next.has(id)) next.clear()
        else {
          next.clear()
          next.add(id)
        }
      }
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === displayRows.length
        ? new Set()
        : new Set(displayRows.map((r) => r.id))
    )
  }

  function commitEdit(id: string, col: string, value: string) {
    setDirty((d) => ({
      ...d,
      [id]: { ...(d[id] ?? {}), [col]: value },
    }))
    setEditing(null)
  }

  const dirtyCount = Object.keys(dirty).length
  const hasSelection = selected.size > 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <TableToolbar
        table={table}
        dirtyCount={dirtyCount}
        selectionCount={selected.size}
        onRefresh={() => {
          setDirty({})
          setSelected(new Set())
          toast.success("Refreshed", { description: `${tableName}` })
        }}
        onSave={() => {
          toast.success(
            `Committed ${dirtyCount} change${dirtyCount === 1 ? "" : "s"}`
          )
          setDirty({})
        }}
        onDelete={() => {
          toast.warning(`${selected.size} rows queued for deletion`)
          setSelected(new Set())
        }}
      />

      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-0 left-0 z-20 h-9 w-10 border-r border-b border-border/80 bg-toolbar/95 px-2 text-left font-mono text-[10px] tracking-[0.08em] text-muted-foreground/70 uppercase backdrop-blur"
              >
                <input
                  type="checkbox"
                  aria-label="Select all"
                  className="accent-primary"
                  checked={
                    selected.size > 0 && selected.size === displayRows.length
                  }
                  onChange={toggleAll}
                />
              </th>
              {table.columns.map((col) => (
                <th
                  key={col.name}
                  scope="col"
                  className="sticky top-0 z-10 h-9 border-r border-b border-border/80 bg-toolbar/95 px-3 text-left font-normal backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.name)}
                    className="group/h flex w-full min-w-0 items-center gap-1.5 text-[12px] font-medium text-foreground/90"
                  >
                    {col.isPrimary && (
                      <KeyIcon className="size-3 text-amber-400" />
                    )}
                    {col.isForeign && !col.isPrimary && (
                      <LinkIcon className="size-3 text-primary" />
                    )}
                    <span className="font-mono tracking-tight">{col.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      {col.type}
                      {col.isNullable ? "?" : ""}
                    </span>
                    <span
                      className="ml-auto flex size-4 items-center justify-center text-muted-foreground/70 opacity-0 transition-opacity group-hover/h:opacity-100 data-[active=true]:opacity-100"
                      data-active={sort?.col === col.name}
                    >
                      {sort?.col === col.name ? (
                        sort.dir === "asc" ? (
                          <ArrowUpIcon className="size-3" />
                        ) : (
                          <ArrowDownIcon className="size-3" />
                        )
                      ) : (
                        <ArrowDownIcon className="size-3" />
                      )}
                    </span>
                  </button>
                </th>
              ))}
              <th className="sticky top-0 z-10 h-9 w-8 border-b border-border/80 bg-toolbar/95 backdrop-blur" />
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, idx) => {
              const isSelected = selected.has(row.id)
              const rowDirty = dirty[row.id] ?? {}
              return (
                <tr
                  key={row.id}
                  onClick={(e) => toggleRow(row.id, e)}
                  data-selected={isSelected}
                  className={cn(
                    "group/row cursor-default transition-colors",
                    "hover:bg-muted/40",
                    "data-[selected=true]:bg-primary/10"
                  )}
                >
                  <td
                    className={cn(
                      "sticky left-0 z-10 h-8 w-10 border-r border-b border-border/40 bg-background px-2 text-center font-mono text-[10.5px] text-muted-foreground/60 group-hover/row:bg-muted/40",
                      isSelected && "bg-primary/10 text-foreground/90"
                    )}
                  >
                    {isSelected ? (
                      <span className="text-primary">●</span>
                    ) : (
                      idx + 1
                    )}
                  </td>

                  {table.columns.map((col) => {
                    const raw = row.values[col.name]
                    const override = rowDirty[col.name]
                    const value = override ?? raw
                    const isEditing =
                      editing?.id === row.id && editing.col === col.name
                    const isDirty = override !== undefined

                    return (
                      <td
                        key={col.name}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          setEditing({ id: row.id, col: col.name })
                        }}
                        className={cn(
                          "relative h-8 max-w-[280px] min-w-[120px] truncate border-r border-b border-border/40 px-3 font-mono text-[12.5px]",
                          isDirty && "bg-amber-400/10",
                          col.isPrimary && "text-amber-300/95"
                        )}
                      >
                        {isEditing ? (
                          <EditableCell
                            initialValue={value === null ? "" : String(value)}
                            onCommit={(v) => commitEdit(row.id, col.name, v)}
                            onCancel={() => setEditing(null)}
                          />
                        ) : value === null ? (
                          <span className="text-muted-foreground/50">NULL</span>
                        ) : typeof value === "boolean" ? (
                          <span
                            className={
                              value
                                ? "text-emerald-400"
                                : "text-muted-foreground"
                            }
                          >
                            {value ? "true" : "false"}
                          </span>
                        ) : (
                          <span className="truncate">{String(value)}</span>
                        )}
                        {isDirty && !isEditing && (
                          <span className="absolute top-1 right-1.5 inline-flex size-1 rounded-full bg-amber-400" />
                        )}
                      </td>
                    )
                  })}
                  <td className="h-8 w-8 border-b border-border/40 bg-background group-hover/row:bg-muted/40 group-data-[selected=true]/row:bg-primary/10">
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="mx-auto hidden size-6 place-items-center rounded text-muted-foreground/60 group-hover/row:grid hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontalIcon className="size-3.5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Paginator
        total={table.rowCount}
        loaded={displayRows.length}
        hasSelection={hasSelection}
        selection={selected.size}
      />
    </div>
  )
}

function EditableCell({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string
  onCommit: (v: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onCommit(value)
        if (e.key === "Escape") onCancel()
      }}
      className="absolute inset-0 h-full w-full bg-background px-3 font-mono text-[12.5px] text-foreground ring-2 ring-primary outline-none ring-inset"
    />
  )
}

function TableToolbar({
  table,
  dirtyCount,
  selectionCount,
  onRefresh,
  onSave,
  onDelete,
}: {
  table: TableSchema
  dirtyCount: number
  selectionCount: number
  onRefresh: () => void
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-border bg-toolbar/60 px-2">
      <div className="flex items-center gap-1.5 pr-1.5">
        <span className="font-mono text-[13px] font-semibold tracking-tight">
          {table.name}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          · {table.columns.length} cols · {formatCount(table.rowCount)} rows
        </span>
      </div>

      <div className="mx-0.5 h-4 w-px bg-border" />

      <ChromeButton title="Add row (⌘ ↵)">
        <PlusIcon className="size-3.5" />
        <span className="text-[12px]">Add row</span>
      </ChromeButton>
      <ChromeButton
        title="Delete selected"
        onClick={onDelete}
        className={cn(
          selectionCount === 0 && "pointer-events-none opacity-40",
          selectionCount > 0 &&
            "text-red-400 hover:bg-red-500/10 hover:text-red-300"
        )}
      >
        <Trash2Icon className="size-3.5" />
        <span className="text-[12px]">Delete</span>
        {selectionCount > 0 && (
          <span className="ml-0.5 rounded bg-red-500/20 px-1 font-mono text-[10px]">
            {selectionCount}
          </span>
        )}
      </ChromeButton>

      <div className="mx-0.5 h-4 w-px bg-border" />

      <ChromeButton title="Filter (⌘ F)">
        <FilterIcon className="size-3.5" />
        <span className="text-[12px]">Filter</span>
      </ChromeButton>
      <ChromeButton title="Refresh (⌘ R)" onClick={onRefresh}>
        <RefreshCcwIcon className="size-3.5" />
        <span className="text-[12px]">Refresh</span>
      </ChromeButton>

      <div className="ml-auto flex items-center gap-1.5">
        {dirtyCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-400">
            <CircleIcon className="size-2 fill-current" />
            {dirtyCount} pending change{dirtyCount === 1 ? "" : "s"}
          </span>
        )}
        <ChromeButton
          variant="primary"
          onClick={onSave}
          className={cn(dirtyCount === 0 && "pointer-events-none opacity-40")}
          title="Commit (⌘ S)"
        >
          <SaveIcon className="size-3.5" />
          <span className="text-[12px]">Commit</span>
        </ChromeButton>
      </div>
    </div>
  )
}

function Paginator({
  total,
  loaded,
  hasSelection,
  selection,
}: {
  total: number
  loaded: number
  hasSelection: boolean
  selection: number
}) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-2 border-t border-border bg-toolbar/40 px-3 font-mono text-[11px] text-muted-foreground">
      <span>
        {loaded.toLocaleString()} of {total.toLocaleString()} rows
      </span>
      {hasSelection && (
        <span className="text-foreground/80">· {selection} selected</span>
      )}
      <div className="mx-2 h-3 w-px bg-border" />
      <button className="grid size-5 place-items-center rounded hover:bg-muted hover:text-foreground">
        <ChevronLeftIcon className="size-3.5" />
      </button>
      <span className="text-foreground/80">1</span>
      <span>/</span>
      <span>{Math.max(1, Math.ceil(total / 100)).toLocaleString()}</span>
      <button className="grid size-5 place-items-center rounded hover:bg-muted hover:text-foreground">
        <ChevronRightIcon className="size-3.5" />
      </button>
      <div className="ml-auto">Limit 100 rows</div>
    </div>
  )
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
