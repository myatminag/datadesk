import { ClockIcon, GaugeIcon, HashIcon, ZapIcon } from "lucide-react"

import { mockQueryResult } from "./mock-data"
import { cn } from "@/lib/utils"
import {
  useActiveConnection,
  useActiveTab,
  useDataDeskStore,
} from "@/stores/datadesk-store"

export function StatusBar() {
  const active = useActiveConnection()
  const tab = useActiveTab()
  const tabs = useDataDeskStore((s) => s.tabs)

  const rows =
    tab?.kind === "query"
      ? mockQueryResult.rows.length
      : tab?.kind === "table" && active
        ? (active.tables.find((t) => t.name === tab.tableName)?.rowCount ?? 0)
        : 0

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-border bg-toolbar/80 px-3 font-mono text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "size-1.5 rounded-full",
            active?.status === "connected"
              ? "bg-emerald-400"
              : active?.status === "error"
                ? "bg-red-500"
                : "bg-zinc-500"
          )}
          aria-hidden
        />
        <span className="text-foreground/80">
          {active?.status === "connected" ? "connected" : "offline"}
        </span>
        {active && <span>· {active.host}</span>}
      </div>

      <Divider />

      <StatusItem icon={<ClockIcon className="size-3" />}>
        <span>{mockQueryResult.elapsedMs} ms</span>
      </StatusItem>

      <StatusItem icon={<HashIcon className="size-3" />}>
        <span>
          {rows.toLocaleString()} {rows === 1 ? "row" : "rows"}
        </span>
      </StatusItem>

      <Divider />

      <StatusItem icon={<GaugeIcon className="size-3" />}>
        <span>{tabs.length} tabs open</span>
      </StatusItem>

      <div className="ml-auto flex items-center gap-3">
        <StatusItem icon={<ZapIcon className="size-3 text-emerald-400" />}>
          <span>utf-8</span>
        </StatusItem>
        <span>v0.1.0</span>
      </div>
    </footer>
  )
}

function Divider() {
  return <span className="h-3 w-px bg-border" aria-hidden />
}

function StatusItem({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span className="flex items-center gap-1">
      {icon}
      {children}
    </span>
  )
}
