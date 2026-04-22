"use client"

import { useReactFlow } from "@xyflow/react"
import {
  ImageIcon,
  LayoutGridIcon,
  MaximizeIcon,
  PlusIcon,
  RedoIcon,
  UndoIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { autoLayout } from "@/lib/auto-layout"
import { toPng } from "html-to-image"
import { useDiagramStore } from "@/stores/diagram-store"
import type { Diagram } from "@/lib/types"

interface Props {
  diagram: Diagram
}

export function CanvasToolbar({ diagram }: Props) {
  const addTable = useDiagramStore((s) => s.addTable)
  const replace = useDiagramStore((s) => s.replaceTablesAndRelations)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const canUndo = useDiagramStore((s) => s.history.length > 0)
  const canRedo = useDiagramStore((s) => s.future.length > 0)
  const rf = useReactFlow()

  async function handleAutoLayout() {
    try {
      const next = await autoLayout(diagram.tables, diagram.relations)
      replace(next, diagram.relations)
      requestAnimationFrame(() => rf.fitView({ padding: 0.2, duration: 300 }))
    } catch (err) {
      toast.error("Auto-layout failed", {
        description: (err as Error).message,
      })
    }
  }

  async function handleExportPng() {
    const viewport = document.querySelector<HTMLElement>(
      ".react-flow__viewport"
    )
    const container = document.querySelector<HTMLElement>(".react-flow")
    const target = container ?? viewport
    if (!target) return
    try {
      const dataUrl = await toPng(target, {
        cacheBust: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        pixelRatio: 2,
      })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `${diagram.name || "diagram"}.png`
      link.click()
      toast.success("Exported PNG")
    } catch (err) {
      toast.error("Export failed", { description: (err as Error).message })
    }
  }

  return (
    <div className="edge-highlight pointer-events-auto absolute top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-toolbar p-1.5 text-toolbar-foreground shadow-tahoe-md">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={() => addTable()}>
            <PlusIcon data-icon="inline-start" />
            Table
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add a new table</TooltipContent>
      </Tooltip>

      <div className="mx-1 h-5 w-px bg-border" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAutoLayout}
            aria-label="Auto layout"
          >
            <LayoutGridIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Auto-layout</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => rf.fitView({ padding: 0.2, duration: 300 })}
            aria-label="Fit view"
          >
            <MaximizeIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Fit view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExportPng}
            aria-label="Export PNG"
          >
            <ImageIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Export PNG</TooltipContent>
      </Tooltip>

      <div className="mx-1 h-5 w-px bg-border" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            aria-label="Undo"
          >
            <UndoIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            aria-label="Redo"
          >
            <RedoIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>
    </div>
  )
}
