"use client"

import { ArrowRightIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  REFERENTIAL_ACTIONS,
  RELATION_TYPES,
  type Diagram,
  type Relation,
} from "@/lib/types"
import { useDiagramStore } from "@/stores/diagram-store"
import { useEditorStore } from "@/stores/editor-store"

interface Props {
  relation: Relation
  diagram: Diagram
}

const RELATION_LABEL: Record<string, string> = {
  oneToOne: "One to one",
  oneToMany: "One to many",
  manyToMany: "Many to many",
}

export function RelationEditorPanel({ relation, diagram }: Props) {
  const updateRelation = useDiagramStore((s) => s.updateRelation)
  const deleteRelation = useDiagramStore((s) => s.deleteRelation)
  const clearSelection = useEditorStore((s) => s.clearSelection)

  const fromTable = diagram.tables.find((t) => t.id === relation.fromTableId)
  const toTable = diagram.tables.find((t) => t.id === relation.toTableId)
  const fromCol = fromTable?.columns.find((c) => c.id === relation.fromColumnId)
  const toCol = toTable?.columns.find((c) => c.id === relation.toColumnId)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-end gap-2.5 border-b px-5 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Constraint name
          </Label>
          <Input
            value={relation.name ?? ""}
            placeholder="fk_name"
            onChange={(e) =>
              updateRelation(relation.id, { name: e.target.value || undefined })
            }
            className="font-mono"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            deleteRelation(relation.id)
            clearSelection()
          }}
          aria-label="Delete relation"
        >
          <Trash2Icon />
        </Button>
      </header>

      <div className="flex flex-col gap-5 p-5">
        <div className="rounded-lg border bg-background/60 p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">
            Reference
          </div>
          <div className="flex items-center gap-2.5 text-base font-medium">
            <span className="truncate">
              <span className="text-muted-foreground">
                {fromTable?.name ?? "?"}.
              </span>
              {fromCol?.name ?? "?"}
            </span>
            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              <span className="text-muted-foreground">
                {toTable?.name ?? "?"}.
              </span>
              {toCol?.name ?? "?"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Cardinality
          </Label>
          <Select
            value={relation.type}
            onValueChange={(v) =>
              updateRelation(relation.id, { type: v as Relation["type"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {RELATION_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-muted-foreground">
              On delete
            </Label>
            <Select
              value={relation.onDelete ?? "none"}
              onValueChange={(v) =>
                updateRelation(relation.id, {
                  onDelete:
                    v === "none" ? undefined : (v as Relation["onDelete"]),
                })
              }
            >
              <SelectTrigger className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {REFERENTIAL_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a} className="capitalize">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-muted-foreground">
              On update
            </Label>
            <Select
              value={relation.onUpdate ?? "none"}
              onValueChange={(v) =>
                updateRelation(relation.id, {
                  onUpdate:
                    v === "none" ? undefined : (v as Relation["onUpdate"]),
                })
              }
            >
              <SelectTrigger className="w-full capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {REFERENTIAL_ACTIONS.map((a) => (
                  <SelectItem key={a} value={a} className="capitalize">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
