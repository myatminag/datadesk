import { Handle, Position, type NodeProps } from "@xyflow/react"
import { KeyIcon, LinkIcon } from "lucide-react"
import { memo } from "react"

import { cn } from "@/lib/utils"
import type { Table } from "@/lib/types"

export interface TableNodeData extends Record<string, unknown> {
  table: Table
  selected?: boolean
}

export const TABLE_NODE_WIDTH = 300
export const TABLE_NODE_ROW_HEIGHT = 36
export const TABLE_NODE_HEADER_HEIGHT = 52

export const TableNode = memo(function TableNode(
  props: NodeProps & { data: TableNodeData }
) {
  const { data, selected } = props
  const { table } = data

  return (
    <div
      data-selected={selected ? "true" : undefined}
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-tahoe-sm transition-[box-shadow,border-color]",
        "data-[selected=true]:border-primary data-[selected=true]:shadow-tahoe-md data-[selected=true]:ring-2 data-[selected=true]:ring-primary/20"
      )}
      style={{ width: TABLE_NODE_WIDTH }}
    >
      <div
        className="flex items-center gap-2.5 border-b bg-muted/50 px-4"
        style={{ height: TABLE_NODE_HEADER_HEIGHT }}
      >
        <span
          aria-hidden
          className="size-2.5 rounded-full"
          style={{ background: table.color ?? "var(--primary)" }}
        />
        <span className="flex-1 truncate text-base font-semibold tracking-tight">
          {table.name}
        </span>
        <span className="rounded-md bg-background/70 px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {table.columns.length}
        </span>
      </div>

      <div className="divide-y divide-border/60">
        {table.columns.map((col) => (
          <div
            key={col.id}
            className="group/row relative flex items-center gap-2.5 px-4 text-sm transition-colors hover:bg-accent/50"
            style={{ height: TABLE_NODE_ROW_HEIGHT }}
          >
            <Handle
              type="target"
              position={Position.Left}
              id={`${col.id}-l`}
              className="left-0! size-2.5! -translate-x-1/2! border! border-background! bg-muted-foreground/50!"
            />
            <span className="flex size-4 shrink-0 items-center justify-center">
              {col.isPrimary ? (
                <KeyIcon
                  className="size-3.5 text-amber-500"
                  aria-label="Primary key"
                />
              ) : col.isUnique ? (
                <LinkIcon
                  className="size-3.5 text-sky-500"
                  aria-label="Unique"
                />
              ) : null}
            </span>
            <span
              className={cn(
                "flex-1 truncate font-medium",
                col.isPrimary ? "text-foreground" : "text-foreground/90"
              )}
            >
              {col.name}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {col.type}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={`${col.id}-r`}
              className="right-0! size-2.5! translate-x-1/2! border! border-background! bg-muted-foreground/50!"
            />
          </div>
        ))}

        {table.columns.length === 0 && (
          <div className="px-4 py-5 text-sm text-muted-foreground">
            No columns yet.
          </div>
        )}
      </div>
    </div>
  )
})
