import { create } from "zustand"
import { persist } from "zustand/middleware"

import { createId } from "@/lib/id"
import type { Column, Diagram, Dialect, Relation, Table } from "@/lib/types"

const HISTORY_LIMIT = 50

interface HistoryEntry {
  tables: Table[]
  relations: Relation[]
}

interface DiagramState {
  diagrams: Record<string, Diagram>
  order: string[]
  activeDiagramId: string | null
  history: HistoryEntry[]
  future: HistoryEntry[]
}

interface DiagramActions {
  createDiagram: (name?: string, dialect?: Dialect) => string
  deleteDiagram: (id: string) => void
  renameDiagram: (id: string, name: string) => void
  setActiveDiagram: (id: string | null) => void
  setDialect: (dialect: Dialect) => void
  importDiagram: (diagram: Diagram) => string

  addTable: (init?: Partial<Table>) => string
  updateTable: (id: string, patch: Partial<Table>) => void
  deleteTable: (id: string) => void
  setTablePosition: (id: string, position: { x: number; y: number }) => void

  addColumn: (tableId: string, init?: Partial<Column>) => string
  updateColumn: (
    tableId: string,
    columnId: string,
    patch: Partial<Column>
  ) => void
  deleteColumn: (tableId: string, columnId: string) => void
  reorderColumns: (tableId: string, nextIds: string[]) => void

  addRelation: (init: Omit<Relation, "id">) => string
  updateRelation: (id: string, patch: Partial<Relation>) => void
  deleteRelation: (id: string) => void

  replaceTablesAndRelations: (tables: Table[], relations: Relation[]) => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

type Store = DiagramState & DiagramActions

function nowIso() {
  return new Date().toISOString()
}

function emptyDiagram(name: string, dialect: Dialect): Diagram {
  const ts = nowIso()

  return {
    id: createId("dg"),
    name,
    dialect,
    tables: [],
    relations: [],
    createdAt: ts,
    updatedAt: ts,
  }
}

function getActive(state: DiagramState): Diagram | null {
  if (!state.activeDiagramId) return null

  return state.diagrams[state.activeDiagramId] ?? null
}

function snapshotOf(d: Diagram): HistoryEntry {
  return {
    tables: d.tables.map((t) => ({
      ...t,
      columns: t.columns.map((c) => ({ ...c })),
    })),
    relations: d.relations.map((r) => ({ ...r })),
  }
}

function withHistory(
  set: (fn: (s: Store) => Partial<Store> | Store) => void,
  get: () => Store,
  mutator: (draft: Diagram) => void,
  { record = true }: { record?: boolean } = {}
) {
  const state = get()
  const active = getActive(state)
  if (!active) return
  const prev = snapshotOf(active)
  const next: Diagram = {
    ...active,
    tables: active.tables.map((t) => ({
      ...t,
      columns: t.columns.map((c) => ({ ...c })),
    })),
    relations: active.relations.map((r) => ({ ...r })),
    updatedAt: nowIso(),
  }
  mutator(next)
  set((s) => ({
    diagrams: { ...s.diagrams, [active.id]: next },
    history: record
      ? [...s.history.slice(-HISTORY_LIMIT + 1), prev]
      : s.history,
    future: record ? [] : s.future,
  }))
}

export const useDiagramStore = create<Store>()(
  persist(
    (set, get) => ({
      diagrams: {},
      order: [],
      activeDiagramId: null,
      history: [],
      future: [],

      createDiagram: (name = "Untitled diagram", dialect = "postgres") => {
        const d = emptyDiagram(name, dialect)
        set((s) => ({
          diagrams: { ...s.diagrams, [d.id]: d },
          order: [d.id, ...s.order],
          activeDiagramId: d.id,
          history: [],
          future: [],
        }))
        return d.id
      },

      deleteDiagram: (id) => {
        set((s) => {
          const { [id]: _removed, ...rest } = s.diagrams
          const order = s.order.filter((x) => x !== id)
          return {
            diagrams: rest,
            order,
            activeDiagramId:
              s.activeDiagramId === id ? (order[0] ?? null) : s.activeDiagramId,
            history: s.activeDiagramId === id ? [] : s.history,
            future: s.activeDiagramId === id ? [] : s.future,
          }
        })
      },

      renameDiagram: (id, name) => {
        set((s) => {
          const d = s.diagrams[id]
          if (!d) return {}
          return {
            diagrams: {
              ...s.diagrams,
              [id]: { ...d, name, updatedAt: nowIso() },
            },
          }
        })
      },

      setActiveDiagram: (id) => {
        set({ activeDiagramId: id, history: [], future: [] })
      },

      setDialect: (dialect) => {
        const id = get().activeDiagramId
        if (!id) return
        set((s) => {
          const d = s.diagrams[id]
          if (!d) return {}
          return {
            diagrams: {
              ...s.diagrams,
              [id]: { ...d, dialect, updatedAt: nowIso() },
            },
          }
        })
      },

      importDiagram: (diagram) => {
        const fresh: Diagram = {
          ...diagram,
          id: createId("dg"),
          updatedAt: nowIso(),
        }
        set((s) => ({
          diagrams: { ...s.diagrams, [fresh.id]: fresh },
          order: [fresh.id, ...s.order],
          activeDiagramId: fresh.id,
          history: [],
          future: [],
        }))
        return fresh.id
      },

      addTable: (init) => {
        const id = createId("tbl")
        withHistory(set, get, (d) => {
          const col: Column = {
            id: createId("col"),
            name: "id",
            type:
              d.dialect === "postgres"
                ? "serial"
                : d.dialect === "mysql"
                  ? "int"
                  : "integer",
            nullable: false,
            isPrimary: true,
            isUnique: false,
            isAutoIncrement: true,
          }
          const existing = d.tables.length
          const table: Table = {
            id,
            name: init?.name ?? `table_${existing + 1}`,
            columns: init?.columns ?? [col],
            position: init?.position ?? {
              x: 120 + (existing % 4) * 320,
              y: 120 + Math.floor(existing / 4) * 260,
            },
            color: init?.color,
            note: init?.note,
          }
          d.tables.push(table)
        })
        return id
      },

      updateTable: (id, patch) => {
        withHistory(set, get, (d) => {
          const idx = d.tables.findIndex((t) => t.id === id)
          if (idx >= 0) d.tables[idx] = { ...d.tables[idx], ...patch }
        })
      },

      deleteTable: (id) => {
        withHistory(set, get, (d) => {
          d.tables = d.tables.filter((t) => t.id !== id)
          d.relations = d.relations.filter(
            (r) => r.fromTableId !== id && r.toTableId !== id
          )
        })
      },

      setTablePosition: (id, position) => {
        withHistory(
          set,
          get,
          (d) => {
            const idx = d.tables.findIndex((t) => t.id === id)
            if (idx >= 0) d.tables[idx] = { ...d.tables[idx], position }
          },
          { record: false }
        )
      },

      addColumn: (tableId, init) => {
        const id = createId("col")
        withHistory(set, get, (d) => {
          const t = d.tables.find((x) => x.id === tableId)
          if (!t) return
          const n = t.columns.length + 1
          t.columns.push({
            id,
            name: init?.name ?? `column_${n}`,
            type:
              init?.type ?? (d.dialect === "sqlite" ? "text" : "varchar(255)"),
            nullable: init?.nullable ?? true,
            isPrimary: init?.isPrimary ?? false,
            isUnique: init?.isUnique ?? false,
            isAutoIncrement: init?.isAutoIncrement ?? false,
            default: init?.default,
            note: init?.note,
          })
        })
        return id
      },

      updateColumn: (tableId, columnId, patch) => {
        withHistory(set, get, (d) => {
          const t = d.tables.find((x) => x.id === tableId)
          if (!t) return
          const idx = t.columns.findIndex((c) => c.id === columnId)
          if (idx >= 0) t.columns[idx] = { ...t.columns[idx], ...patch }
        })
      },

      deleteColumn: (tableId, columnId) => {
        withHistory(set, get, (d) => {
          const t = d.tables.find((x) => x.id === tableId)
          if (!t) return
          t.columns = t.columns.filter((c) => c.id !== columnId)
          d.relations = d.relations.filter(
            (r) =>
              !(
                (r.fromTableId === tableId && r.fromColumnId === columnId) ||
                (r.toTableId === tableId && r.toColumnId === columnId)
              )
          )
        })
      },

      reorderColumns: (tableId, nextIds) => {
        withHistory(set, get, (d) => {
          const t = d.tables.find((x) => x.id === tableId)
          if (!t) return
          const map = new Map(t.columns.map((c) => [c.id, c]))
          t.columns = nextIds
            .map((id) => map.get(id))
            .filter((c): c is Column => Boolean(c))
        })
      },

      addRelation: (init) => {
        const id = createId("rel")
        withHistory(set, get, (d) => {
          d.relations.push({ ...init, id })
        })
        return id
      },

      updateRelation: (id, patch) => {
        withHistory(set, get, (d) => {
          const idx = d.relations.findIndex((r) => r.id === id)
          if (idx >= 0) d.relations[idx] = { ...d.relations[idx], ...patch }
        })
      },

      deleteRelation: (id) => {
        withHistory(set, get, (d) => {
          d.relations = d.relations.filter((r) => r.id !== id)
        })
      },

      replaceTablesAndRelations: (tables, relations) => {
        withHistory(set, get, (d) => {
          d.tables = tables
          d.relations = relations
        })
      },

      undo: () => {
        const s = get()
        const active = getActive(s)
        if (!active || s.history.length === 0) return
        const prev = s.history[s.history.length - 1]
        const current = snapshotOf(active)
        set({
          diagrams: {
            ...s.diagrams,
            [active.id]: {
              ...active,
              tables: prev.tables,
              relations: prev.relations,
              updatedAt: nowIso(),
            },
          },
          history: s.history.slice(0, -1),
          future: [...s.future, current],
        })
      },

      redo: () => {
        const s = get()
        const active = getActive(s)
        if (!active || s.future.length === 0) return
        const next = s.future[s.future.length - 1]
        const current = snapshotOf(active)
        set({
          diagrams: {
            ...s.diagrams,
            [active.id]: {
              ...active,
              tables: next.tables,
              relations: next.relations,
              updatedAt: nowIso(),
            },
          },
          history: [...s.history, current],
          future: s.future.slice(0, -1),
        })
      },

      canUndo: () => get().history.length > 0,
      canRedo: () => get().future.length > 0,
    }),
    {
      name: "dbdesigner:v1",
      partialize: (s) => ({
        diagrams: s.diagrams,
        order: s.order,
        activeDiagramId: s.activeDiagramId,
      }),
      version: 1,
    }
  )
)

export function useActiveDiagram(): Diagram | null {
  return useDiagramStore((s) =>
    s.activeDiagramId ? (s.diagrams[s.activeDiagramId] ?? null) : null
  )
}
