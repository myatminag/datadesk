import {
  CommandIcon,
  PlusIcon,
  SearchIcon,
  SidebarIcon,
  SparklesIcon,
  TerminalSquareIcon,
} from "lucide-react"

import { BrandMark } from "./brand-mark"
import type { ConnectionStatus } from "./types"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

import { useActiveConnection, useDataDeskStore } from "@/stores/datadesk-store"

const statusDotClass: Record<ConnectionStatus, string> = {
  connected:
    "bg-emerald-400 shadow-[0_0_0_3px_color-mix(in_oklab,#34d399_25%,transparent)]",
  idle: "bg-amber-400",
  disconnected: "bg-zinc-500",
  error: "bg-red-500",
}

export function TopBar() {
  const active = useActiveConnection()
  const toggleSidebar = useDataDeskStore((s) => s.toggleSidebar)
  const openConnectionModal = useDataDeskStore((s) => s.openConnectionModal)
  const openQueryTab = useDataDeskStore((s) => s.openQueryTab)

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-toolbar/80 px-3 backdrop-blur-sm">
      <div className="flex items-center gap-2.5 pr-1">
        <BrandMark />
        <span className="text-[13px] font-semibold tracking-tight">
          DataDesk
        </span>
      </div>

      <div className="h-5 w-px bg-border/80" />

      <ChromeButton
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        title="Toggle sidebar (⌘ B)"
      >
        <SidebarIcon className="size-3.5" />
      </ChromeButton>

      {active && (
        <div className="flex items-center gap-2 rounded-md border border-border/80 bg-background/60 py-1 pr-2.5 pl-2">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              statusDotClass[active.status]
            )}
          />
          <span className="max-w-[180px] truncate text-[12px] font-medium">
            {active.name}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground/80">
            {active.database}
          </span>
        </div>
      )}

      <div className="mx-auto flex max-w-xl min-w-0 flex-1 items-center">
        <div className="group/search relative flex h-7 w-full items-center gap-2 rounded-md border border-border/80 bg-background/50 px-2.5 text-muted-foreground transition-colors focus-within:border-ring focus-within:bg-background focus-within:ring-[3px] focus-within:ring-ring/20 hover:bg-background">
          <SearchIcon className="size-3.5" />
          <input
            type="text"
            placeholder="Search tables, queries, shortcuts…"
            className="h-full flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/80"
          />
          <span className="flex items-center gap-0.5 rounded border border-border/80 bg-muted/40 px-1 py-[1px] text-[10px] font-medium text-muted-foreground">
            <CommandIcon className="size-2.5" /> K
          </span>
        </div>
      </div>

      <ChromeButton
        onClick={() => openQueryTab(active?.id ?? "conn-prod", "new query")}
        title="New query (⌘ N)"
      >
        <TerminalSquareIcon className="size-3.5" />
        <span className="hidden text-[12px] font-medium md:inline">
          New query
        </span>
      </ChromeButton>

      <ChromeButton
        variant="primary"
        onClick={() => openConnectionModal()}
        title="New connection (⌘ ⇧ N)"
      >
        <PlusIcon className="size-3.5" />
        <span className="hidden text-[12px] font-medium md:inline">
          New connection
        </span>
      </ChromeButton>

      <div className="mx-1 h-5 w-px bg-border/80" />

      <ChromeButton title="AI assistant">
        <SparklesIcon className="size-3.5" />
      </ChromeButton>

      <ThemeToggle />
    </header>
  )
}

type ChromeButtonProps = {
  variant?: "ghost" | "primary"
} & React.ComponentProps<"button">

export function ChromeButton({
  children,
  className,
  variant = "ghost",
  ...props
}: ChromeButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/30 focus-visible:outline-none",
        variant === "primary" &&
          "bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
