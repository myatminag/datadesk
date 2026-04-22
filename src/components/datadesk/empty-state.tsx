import {
  DatabaseIcon,
  DownloadIcon,
  KeyRoundIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react"

import { BrandMark } from "./brand-mark"
import { cn } from "@/lib/utils"
import { useDataDeskStore } from "@/stores/datadesk-store"

export function EmptyState() {
  const openConnectionModal = useDataDeskStore((s) => s.openConnectionModal)

  return (
    <div className="flex h-full items-center justify-center bg-background p-10">
      <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <BrandMark size={44} />
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-semibold tracking-tight">
              No connections yet
            </h2>
            <p className="max-w-sm text-[13.5px] text-muted-foreground">
              Connect to a database to browse tables, run SQL, and edit rows —
              all with the same keyboard-first experience.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openConnectionModal()}
          className="group/cta flex w-full items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-left transition-colors hover:bg-primary/15"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <PlusIcon className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-foreground">
                New connection
              </span>
              <span className="text-[12px] text-muted-foreground">
                PostgreSQL, MySQL, SQLite, SQL Server, Redis
              </span>
            </div>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            ⌘ ⇧ N
          </span>
        </button>

        <div className="grid w-full grid-cols-3 gap-2">
          <SecondaryAction icon={<DownloadIcon className="size-4" />}>
            Import from TablePlus
          </SecondaryAction>
          <SecondaryAction icon={<KeyRoundIcon className="size-4" />}>
            Connect via SSH tunnel
          </SecondaryAction>
          <SecondaryAction icon={<SparklesIcon className="size-4" />}>
            Sample database
          </SecondaryAction>
        </div>

        <div className="flex w-full flex-col gap-2 rounded-lg border border-border/80 bg-toolbar/40 p-4 text-left">
          <div className="flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.05em] text-muted-foreground uppercase">
            <DatabaseIcon className="size-3.5" />
            Recent activity
          </div>
          <EmptyListRow label="Connection history will appear here" />
          <EmptyListRow label="Saved queries will appear here" />
        </div>
      </div>
    </div>
  )
}

function SecondaryAction({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-start gap-1.5 rounded-md border border-border/80 bg-background/40 p-3 text-left text-[12px] font-medium text-foreground transition-colors",
        "hover:border-ring/40 hover:bg-background"
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </button>
  )
}

function EmptyListRow({ label }: { label: string }) {
  return (
    <div className="flex h-7 items-center gap-2 rounded-md border border-dashed border-border/60 bg-background/20 px-2.5 font-mono text-[11px] text-muted-foreground/70">
      <span className="size-1.5 rounded-full bg-muted" />
      {label}
    </div>
  )
}
