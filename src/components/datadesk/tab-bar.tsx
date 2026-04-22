import {
  CopyIcon,
  PlusIcon,
  SplitSquareHorizontalIcon,
  TableIcon,
  TerminalSquareIcon,
  XIcon,
} from "lucide-react"

import type { Tab } from "./types"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { useActiveConnection, useDataDeskStore } from "@/stores/datadesk-store"

export function TabBar() {
  const tabs = useDataDeskStore((s) => s.tabs)
  const activeTabId = useDataDeskStore((s) => s.activeTabId)
  const setActiveTab = useDataDeskStore((s) => s.setActiveTab)
  const closeTab = useDataDeskStore((s) => s.closeTab)
  const duplicateTab = useDataDeskStore((s) => s.duplicateTab)
  const openQueryTab = useDataDeskStore((s) => s.openQueryTab)
  const active = useActiveConnection()

  return (
    <div className="flex h-9 shrink-0 items-end gap-px border-b border-border bg-toolbar/60 px-1.5">
      <div className="flex flex-1 items-end overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <ContextMenu key={t.id}>
            <ContextMenuTrigger asChild>
              <div
                role="tab"
                aria-selected={activeTabId === t.id}
                data-active={activeTabId === t.id}
                onClick={() => setActiveTab(t.id)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    e.preventDefault()
                    closeTab(t.id)
                  }
                }}
                className={cn(
                  "group/tab relative flex h-8 shrink-0 cursor-default items-center gap-1.5 rounded-t-md border border-b-0 border-transparent px-2.5 text-[12px] text-muted-foreground transition-colors",
                  "hover:bg-muted/40 hover:text-foreground",
                  "data-[active=true]:border-border data-[active=true]:bg-background data-[active=true]:text-foreground"
                )}
              >
                {activeTabId === t.id && (
                  <span
                    aria-hidden
                    className="absolute inset-x-2 top-0 h-[1.5px] rounded-full bg-primary"
                  />
                )}
                <TabIcon tab={t} />
                <span className="max-w-[180px] truncate font-mono tracking-tight">
                  {tabLabel(t)}
                </span>
                {t.kind === "query" && (
                  <span className="ml-0.5 size-1 rounded-full bg-amber-400" />
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    closeTab(t.id)
                  }}
                  className="ml-1 grid size-4 place-items-center rounded text-muted-foreground/60 opacity-0 transition-all group-hover/tab:opacity-100 group-data-[active=true]/tab:opacity-100 hover:bg-muted hover:text-foreground"
                  aria-label="Close tab"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => duplicateTab(t.id)}>
                <CopyIcon data-icon="inline-start" />
                Duplicate
                <ContextMenuShortcut>⌘ D</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem>
                <SplitSquareHorizontalIcon data-icon="inline-start" />
                Split right
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onSelect={() => closeTab(t.id)}>
                Close
                <ContextMenuShortcut>⌘ W</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={() => {
                  for (const other of tabs)
                    if (other.id !== t.id) closeTab(other.id)
                }}
              >
                Close others
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}

        <button
          type="button"
          onClick={() => openQueryTab(active?.id ?? "conn-prod", "new query")}
          className="ml-0.5 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="New tab"
        >
          <PlusIcon className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

function TabIcon({ tab }: { tab: Tab }) {
  if (tab.kind === "query")
    return <TerminalSquareIcon className="size-3.5 text-amber-400/90" />
  return <TableIcon className="size-3.5 text-primary/90" />
}

function tabLabel(tab: Tab) {
  if (tab.kind === "table") return tab.tableName
  return tab.title
}
