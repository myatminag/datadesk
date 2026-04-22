import {
  ChevronRightIcon,
  DatabaseIcon,
  EyeIcon,
  FunctionSquareIcon,
  KeyRoundIcon,
  PlugIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
  UnplugIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ChromeButton } from "./top-bar"
import type {
  Connection,
  ConnectionStatus,
  DatabaseEngine,
  TableSchema,
} from "./types"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { useDataDeskStore } from "@/stores/datadesk-store"

const engineLabels: Record<DatabaseEngine, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
  sqlite: "SQLite",
  mssql: "SQL Server",
  redis: "Redis",
}

const statusDot: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-400",
  idle: "bg-amber-400",
  disconnected: "bg-zinc-500",
  error: "bg-red-500",
}

export function Sidebar() {
  const connections = useDataDeskStore((s) => s.connections)
  const expandedGroups = useDataDeskStore((s) => s.expandedGroups)
  const toggleGroup = useDataDeskStore((s) => s.toggleGroup)
  const openConnectionModal = useDataDeskStore((s) => s.openConnectionModal)
  const [filter, setFilter] = useState("")

  const groups = useMemo(() => {
    const map = new Map<DatabaseEngine, Array<Connection>>()
    for (const c of connections) {
      if (filter && !c.name.toLowerCase().includes(filter.toLowerCase()))
        continue
      if (!map.has(c.engine)) map.set(c.engine, [])
      map.get(c.engine)!.push(c)
    }
    return Array.from(map.entries())
  }, [connections, filter])

  return (
    <aside
      data-slot="datadesk-sidebar"
      className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-sidebar"
    >
      <div className="flex items-center gap-1.5 border-b border-border/80 px-2 py-2">
        <div className="flex h-7 flex-1 items-center gap-1.5 rounded-md border border-transparent bg-background/40 px-2 text-muted-foreground focus-within:border-border focus-within:bg-background">
          <SearchIcon className="size-3.5" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search connections…"
            className="h-full w-full bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/80"
          />
        </div>
        <ChromeButton
          onClick={() => openConnectionModal()}
          title="New connection"
          aria-label="New connection"
        >
          <PlusIcon className="size-3.5" />
        </ChromeButton>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1.5">
        {groups.length === 0 && (
          <div className="mt-8 px-3 text-center text-xs text-muted-foreground">
            No connections match “{filter}”.
          </div>
        )}

        {groups.map(([engine, list]) => {
          const expanded = expandedGroups[engine] ?? true
          return (
            <div key={engine} className="mb-1">
              <button
                type="button"
                onClick={() => toggleGroup(engine)}
                className="flex h-6 w-full items-center gap-1.5 rounded-md px-2 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                <ChevronRightIcon
                  className={cn(
                    "size-3 transition-transform duration-150",
                    expanded && "rotate-90"
                  )}
                />
                <span>{engineLabels[engine]}</span>
                <span className="ml-auto font-mono text-[10px] tracking-normal text-muted-foreground/60 normal-case">
                  {list.length}
                </span>
              </button>

              {expanded && (
                <div className="mt-0.5 flex flex-col gap-px">
                  {list.map((c) => (
                    <ConnectionNode key={c.id} connection={c} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

function ConnectionNode({ connection }: { connection: Connection }) {
  const isActive = useDataDeskStore(
    (s) => s.activeConnectionId === connection.id
  )
  const isExpanded = useDataDeskStore(
    (s) => s.expandedConnections[connection.id] ?? false
  )
  const setActiveConnection = useDataDeskStore((s) => s.setActiveConnection)
  const toggleConnection = useDataDeskStore((s) => s.toggleConnection)
  const setStatus = useDataDeskStore((s) => s.setConnectionStatus)
  const removeConnection = useDataDeskStore((s) => s.removeConnection)
  const openConnectionModal = useDataDeskStore((s) => s.openConnectionModal)

  const tables = connection.tables.filter((t) => t.kind === "table")
  const views = connection.tables.filter((t) => t.kind === "view")
  const procedures = connection.tables.filter((t) => t.kind === "procedure")

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => {
              setActiveConnection(connection.id)
              toggleConnection(connection.id)
            }}
            data-active={isActive}
            className={cn(
              "group/conn flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium text-foreground/80 transition-colors",
              "hover:bg-muted/60 hover:text-foreground",
              "data-[active=true]:bg-primary/12 data-[active=true]:text-foreground"
            )}
          >
            <ChevronRightIcon
              className={cn(
                "size-3 text-muted-foreground transition-transform duration-150",
                isExpanded && "rotate-90"
              )}
            />
            <DatabaseIcon className="size-3.5 text-muted-foreground group-hover/conn:text-foreground" />
            <span className="truncate">{connection.name}</span>
            <span
              className={cn(
                "ml-auto size-1.5 rounded-full",
                statusDot[connection.status]
              )}
            />
          </button>

          {isExpanded && (
            <div className="mb-1 ml-3 border-l border-border/60 pl-1">
              <TreeGroup
                label="Tables"
                count={tables.length}
                icon={<TableIcon className="size-3.5" />}
                items={tables}
                connectionId={connection.id}
              />
              <TreeGroup
                label="Views"
                count={views.length}
                icon={<EyeIcon className="size-3.5" />}
                items={views}
                connectionId={connection.id}
              />
              <TreeGroup
                label="Procedures"
                count={procedures.length}
                icon={<FunctionSquareIcon className="size-3.5" />}
                items={procedures}
                connectionId={connection.id}
              />
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="min-w-56">
        {connection.status === "connected" ? (
          <ContextMenuItem
            onSelect={() => {
              setStatus(connection.id, "disconnected")
              toast.message(`Disconnected from ${connection.name}`)
            }}
          >
            <UnplugIcon data-icon="inline-start" />
            Disconnect
            <ContextMenuShortcut>⌘ ⇧ D</ContextMenuShortcut>
          </ContextMenuItem>
        ) : (
          <ContextMenuItem
            onSelect={() => {
              setStatus(connection.id, "connected")
              toast.success(`Connected to ${connection.name}`)
            }}
          >
            <PlugIcon data-icon="inline-start" />
            Connect
            <ContextMenuShortcut>⌘ ⇧ C</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuItem onSelect={() => openConnectionModal(connection.id)}>
          <KeyRoundIcon data-icon="inline-start" />
          Edit connection…
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => toast.info(`Renaming ${connection.name}`)}
        >
          Rename
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onSelect={() => {
            removeConnection(connection.id)
            toast.success(`Deleted ${connection.name}`)
          }}
        >
          Delete…
          <ContextMenuShortcut>⌘ ⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function TreeGroup({
  label,
  count,
  icon,
  items,
  connectionId,
}: {
  label: string
  count: number
  icon: React.ReactNode
  items: Array<TableSchema>
  connectionId: string
}) {
  const [open, setOpen] = useState(true)
  const openTableTab = useDataDeskStore((s) => s.openTableTab)
  const activeTabId = useDataDeskStore((s) => s.activeTabId)
  const tabs = useDataDeskStore((s) => s.tabs)

  if (count === 0) return null

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  const activeTable = activeTab?.kind === "table" ? activeTab : null

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-full items-center gap-1.5 rounded-md px-1.5 text-[11px] font-medium text-muted-foreground/90 transition-colors hover:bg-muted/40 hover:text-foreground"
      >
        <ChevronRightIcon
          className={cn(
            "size-2.5 transition-transform duration-150",
            open && "rotate-90"
          )}
        />
        <span>{label}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
          {count}
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-px pb-0.5 pl-1.5">
          {items.map((t) => {
            const isActive =
              activeTable &&
              activeTable.connectionId === connectionId &&
              activeTable.tableName === t.name
            return (
              <button
                key={t.name}
                type="button"
                onDoubleClick={() => openTableTab(connectionId, t.name)}
                onClick={() => openTableTab(connectionId, t.name)}
                data-active={!!isActive}
                className={cn(
                  "group/table flex h-6 w-full items-center gap-1.5 rounded-md px-2 text-[12px] text-foreground/80 transition-colors",
                  "hover:bg-muted/60 hover:text-foreground",
                  "data-[active=true]:bg-primary/15 data-[active=true]:text-foreground"
                )}
              >
                <span className="text-muted-foreground/80 group-hover/table:text-foreground/80">
                  {icon}
                </span>
                <span className="truncate font-mono tracking-tight">
                  {t.name}
                </span>
                {t.rowCount > 0 && (
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                    {formatCount(t.rowCount)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}
