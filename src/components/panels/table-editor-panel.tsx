"use client"

import {
  KeyIcon,
  LinkIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  COLUMN_TYPE_PRESETS,
  type Column,
  type Dialect,
  type Table,
} from "@/lib/types"
import { useDiagramStore } from "@/stores/diagram-store"
import { useEditorStore } from "@/stores/editor-store"

interface Props {
  table: Table
  dialect: Dialect
}

export function TableEditorPanel({ table, dialect }: Props) {
  const updateTable = useDiagramStore((s) => s.updateTable)
  const deleteTable = useDiagramStore((s) => s.deleteTable)
  const addColumn = useDiagramStore((s) => s.addColumn)
  const updateColumn = useDiagramStore((s) => s.updateColumn)
  const deleteColumn = useDiagramStore((s) => s.deleteColumn)
  const clearSelection = useEditorStore((s) => s.clearSelection)

  const typePresets = COLUMN_TYPE_PRESETS[dialect]

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-end gap-2.5 border-b px-5 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Name
          </Label>
          <Input
            value={table.name}
            onChange={(e) => updateTable(table.id, { name: e.target.value })}
            className="text-base font-medium"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            deleteTable(table.id)
            clearSelection()
          }}
          aria-label="Delete table"
        >
          <Trash2Icon />
        </Button>
      </header>

      <div className="flex h-12 items-center justify-between px-5">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Columns
        </span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {table.columns.length}
        </span>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2.5 px-4 pb-4">
          {table.columns.map((col) => (
            <ColumnRow
              key={col.id}
              tableId={table.id}
              column={col}
              typePresets={typePresets}
              onUpdate={(patch) => updateColumn(table.id, col.id, patch)}
              onDelete={() => deleteColumn(table.id, col.id)}
            />
          ))}
          {table.columns.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No columns yet.
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => addColumn(table.id)}
        >
          <PlusIcon data-icon="inline-start" />
          Add column
        </Button>
      </div>
    </div>
  )
}

function ColumnRow({
  tableId,
  column,
  typePresets,
  onUpdate,
  onDelete,
}: {
  tableId: string
  column: Column
  typePresets: readonly string[]
  onUpdate: (patch: Partial<Column>) => void
  onDelete: () => void
}) {
  const allTypes = useMemo(() => {
    const set = new Set(typePresets)
    if (column.type && !set.has(column.type)) set.add(column.type)
    return Array.from(set)
  }, [typePresets, column.type])

  return (
    <div className="rounded-lg border bg-background/60 p-2.5 transition-colors hover:bg-background">
      <div className="flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center">
          {column.isPrimary ? (
            <KeyIcon className="size-4 text-amber-500" />
          ) : column.isUnique ? (
            <LinkIcon className="size-4 text-sky-500" />
          ) : null}
        </span>
        <Input
          value={column.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="column_name"
          className="flex-1 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-border focus-visible:border-input focus-visible:bg-background"
          data-table-id={tableId}
        />
        <Select
          value={column.type}
          onValueChange={(v) => onUpdate({ type: v })}
        >
          <SelectTrigger className="w-[130px] shrink-0 border-transparent bg-transparent font-mono text-xs text-muted-foreground shadow-none hover:border-border data-[state=open]:border-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allTypes.map((t) => (
              <SelectItem key={t} value={t} className="font-mono text-xs">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
              aria-label="Column options"
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onUpdate({ isPrimary: !column.isPrimary })
              }}
            >
              <Checkbox checked={column.isPrimary} className="mr-2" />
              Primary key
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onUpdate({ isUnique: !column.isUnique })
              }}
            >
              <Checkbox checked={column.isUnique} className="mr-2" />
              Unique
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onUpdate({ nullable: !column.nullable })
              }}
            >
              <Checkbox checked={!column.nullable} className="mr-2" />
              Not null
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onUpdate({ isAutoIncrement: !column.isAutoIncrement })
              }}
            >
              <Checkbox checked={column.isAutoIncrement} className="mr-2" />
              Auto-increment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon data-icon="inline-start" />
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Input
        value={column.default ?? ""}
        onChange={(e) => onUpdate({ default: e.target.value || undefined })}
        placeholder="default value"
        className="mt-2 h-8 border-transparent bg-transparent px-2 text-sm text-muted-foreground shadow-none placeholder:text-muted-foreground/60 hover:border-border focus-visible:border-input focus-visible:bg-background"
      />
    </div>
  )
}
