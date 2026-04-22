import { useEffect } from "react"

import { ConnectionModal } from "./connection-modal"
import { EmptyState } from "./empty-state"
import { QueryEditor } from "./query-editor"
import { Sidebar } from "./sidebar"
import { StatusBar } from "./status-bar"
import { TabBar } from "./tab-bar"
import { TableView } from "./table-view"
import { TopBar } from "./top-bar"
import {
  useActiveConnection,
  useActiveTab,
  useDataDeskStore,
} from "@/stores/datadesk-store"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function DataDeskAppShell() {
  const connections = useDataDeskStore((s) => s.connections)
  const sidebarCollapsed = useDataDeskStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useDataDeskStore((s) => s.toggleSidebar)
  const openQueryTab = useDataDeskStore((s) => s.openQueryTab)
  const openConnectionModal = useDataDeskStore((s) => s.openConnectionModal)
  const activeConnection = useActiveConnection()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === "b") {
        e.preventDefault()
        toggleSidebar()
      }
      if (meta && !e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault()
        openQueryTab(activeConnection?.id ?? "conn-prod", "new query")
      }
      if (meta && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault()
        openConnectionModal()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggleSidebar, openQueryTab, openConnectionModal, activeConnection?.id])

  const hasConnections = connections.length > 0

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background text-foreground">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        {hasConnections ? (
          <ResizablePanelGroup
            orientation="horizontal"
            className="h-full min-h-0"
          >
            {!sidebarCollapsed && (
              <>
                <ResizablePanel
                  defaultSize={18}
                  minSize={14}
                  maxSize={34}
                  className="min-w-[220px]"
                >
                  <Sidebar />
                </ResizablePanel>
                <ResizableHandle className="bg-border" />
              </>
            )}

            <ResizablePanel defaultSize={82} minSize={40}>
              <Workspace />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="flex min-h-0 flex-1">
            <EmptyState />
          </div>
        )}
      </div>

      <StatusBar />

      <ConnectionModal />
    </div>
  )
}

function Workspace() {
  const tab = useActiveTab()
  const connection = useActiveConnection()
  const tabs = useDataDeskStore((s) => s.tabs)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TabBar />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tabs.length === 0 ? (
          <NoTabsState />
        ) : tab?.kind === "table" && connection ? (
          <TableView connection={connection} tableName={tab.tableName} />
        ) : tab?.kind === "query" ? (
          <QueryEditor tab={tab} />
        ) : (
          <NoTabsState />
        )}
      </div>
    </div>
  )
}

function NoTabsState() {
  const openQueryTab = useDataDeskStore((s) => s.openQueryTab)
  const active = useActiveConnection()
  return (
    <div className="grid flex-1 place-items-center bg-background text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="font-mono text-[12px] tracking-[0.08em] text-muted-foreground/80 uppercase">
          No tab open
        </div>
        <button
          type="button"
          onClick={() => openQueryTab(active?.id ?? "conn-prod", "new query")}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          New query
          <span className="font-mono text-[11px] opacity-80">⌘ N</span>
        </button>
      </div>
    </div>
  )
}
