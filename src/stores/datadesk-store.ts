import { create } from "zustand"

import type {
  Connection,
  ConnectionStatus,
  QueryTab,
  Tab,
  TableTab,
} from "@/components/datadesk/types"
import { mockConnections, sampleQuery } from "@/components/datadesk/mock-data"

interface DataDeskState {
  connections: Array<Connection>
  activeConnectionId: string | null
  expandedConnections: Record<string, boolean>
  expandedGroups: Record<string, boolean>

  tabs: Array<Tab>
  activeTabId: string | null

  sidebarWidth: number
  sidebarCollapsed: boolean

  isConnectionModalOpen: boolean
  editingConnectionId: string | null

  setActiveConnection: (id: string) => void
  toggleConnection: (id: string) => void
  toggleGroup: (key: string) => void
  setConnectionStatus: (id: string, status: ConnectionStatus) => void
  removeConnection: (id: string) => void
  upsertConnection: (conn: Connection) => void

  openTableTab: (connectionId: string, tableName: string) => void
  openQueryTab: (connectionId: string, title?: string, sql?: string) => void
  closeTab: (id: string) => void
  duplicateTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateQueryTab: (
    id: string,
    patch: Partial<Pick<QueryTab, "sql" | "title">>
  ) => void

  toggleSidebar: () => void
  setSidebarWidth: (w: number) => void

  openConnectionModal: (editingId?: string) => void
  closeConnectionModal: () => void
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export const useDataDeskStore = create<DataDeskState>((set) => ({
  connections: mockConnections,
  activeConnectionId: mockConnections[0]?.id ?? null,
  expandedConnections: { "conn-prod": true },
  expandedGroups: { postgres: true, mysql: true, sqlite: true },

  tabs: [
    {
      id: "tab-1",
      kind: "table",
      connectionId: "conn-prod",
      tableName: "users",
    } satisfies TableTab,
    {
      id: "tab-2",
      kind: "query",
      connectionId: "conn-prod",
      title: "users by role",
      sql: sampleQuery,
    } satisfies QueryTab,
  ],
  activeTabId: "tab-1",

  sidebarWidth: 272,
  sidebarCollapsed: false,

  isConnectionModalOpen: false,
  editingConnectionId: null,

  setActiveConnection: (id) => set({ activeConnectionId: id }),

  toggleConnection: (id) =>
    set((s) => ({
      expandedConnections: {
        ...s.expandedConnections,
        [id]: !s.expandedConnections[id],
      },
    })),

  toggleGroup: (key) =>
    set((s) => ({
      expandedGroups: { ...s.expandedGroups, [key]: !s.expandedGroups[key] },
    })),

  setConnectionStatus: (id, status) =>
    set((s) => ({
      connections: s.connections.map((c) =>
        c.id === id ? { ...c, status } : c
      ),
    })),

  removeConnection: (id) =>
    set((s) => ({
      connections: s.connections.filter((c) => c.id !== id),
      tabs: s.tabs.filter((t) => t.connectionId !== id),
      activeConnectionId:
        s.activeConnectionId === id
          ? (s.connections.find((c) => c.id !== id)?.id ?? null)
          : s.activeConnectionId,
    })),

  upsertConnection: (conn) =>
    set((s) => {
      const exists = s.connections.some((c) => c.id === conn.id)
      return {
        connections: exists
          ? s.connections.map((c) => (c.id === conn.id ? conn : c))
          : [...s.connections, conn],
        activeConnectionId: conn.id,
        expandedConnections: {
          ...s.expandedConnections,
          [conn.id]: true,
        },
      }
    }),

  openTableTab: (connectionId, tableName) =>
    set((s) => {
      const existing = s.tabs.find(
        (t) =>
          t.kind === "table" &&
          t.connectionId === connectionId &&
          t.tableName === tableName
      )
      if (existing) return { activeTabId: existing.id }
      const id = uid("tab")
      return {
        tabs: [...s.tabs, { id, kind: "table", connectionId, tableName }],
        activeTabId: id,
      }
    }),

  openQueryTab: (connectionId, title = "query", sql = "select 1;") =>
    set((s) => {
      const id = uid("tab")
      return {
        tabs: [...s.tabs, { id, kind: "query", connectionId, title, sql }],
        activeTabId: id,
      }
    }),

  closeTab: (id) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id)
      const tabs = s.tabs.filter((t) => t.id !== id)
      const activeTabId =
        s.activeTabId === id
          ? (tabs.at(idx)?.id ?? tabs.at(idx - 1)?.id ?? null)
          : s.activeTabId
      return { tabs, activeTabId }
    }),

  duplicateTab: (id) =>
    set((s) => {
      const t = s.tabs.find((x) => x.id === id)
      if (!t) return {}
      const newId = uid("tab")
      const clone: Tab =
        t.kind === "table"
          ? { ...t, id: newId }
          : { ...t, id: newId, title: `${t.title} copy` }
      return { tabs: [...s.tabs, clone], activeTabId: newId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateQueryTab: (id, patch) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id && t.kind === "query" ? { ...t, ...patch } : t
      ),
    })),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setSidebarWidth: (w) =>
    set({ sidebarWidth: Math.max(200, Math.min(480, w)) }),

  openConnectionModal: (editingId) =>
    set({
      isConnectionModalOpen: true,
      editingConnectionId: editingId ?? null,
    }),

  closeConnectionModal: () =>
    set({ isConnectionModalOpen: false, editingConnectionId: null }),
}))

export function useActiveConnection() {
  return useDataDeskStore(
    (s) => s.connections.find((c) => c.id === s.activeConnectionId) ?? null
  )
}

export function useActiveTab() {
  return useDataDeskStore(
    (s) => s.tabs.find((t) => t.id === s.activeTabId) ?? null
  )
}
