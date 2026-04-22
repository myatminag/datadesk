import {
  CodeIcon,
  DownloadIcon,
  HomeIcon,
  PanelLeftIcon,
  PanelRightCloseIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CanvasProvider,
  DiagramCanvas,
} from "@/components/canvas/diagram-canvas"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SqlPanel } from "@/components/panels/sql-panel"
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar"
import { ProjectSwitcher } from "@/components/panels/project-switcher"
import { RelationEditorPanel } from "@/components/panels/relation-editor-panel"
import { TableEditorPanel } from "@/components/panels/table-editor-panel"
import { DIALECTS, type Dialect } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  exportDiagramJson,
  importDiagramJson,
  pickJsonFile,
} from "@/lib/storage"
import { useDiagramStore } from "@/stores/diagram-store"
import { useEditorStore } from "@/stores/editor-store"

export const Route = createFileRoute("/editor/$diagramId")({
  component: EditorPage,
})

function EditorPage() {
  const { diagramId } = Route.useParams()
  const diagram = useDiagramStore((s) => s.diagrams[diagramId] ?? null)
  const activeId = useDiagramStore((s) => s.activeDiagramId)
  const setActive = useDiagramStore((s) => s.setActiveDiagram)
  const renameDiagram = useDiagramStore((s) => s.renameDiagram)
  const setDialect = useDiagramStore((s) => s.setDialect)
  const addTable = useDiagramStore((s) => s.addTable)
  const importDiagramToStore = useDiagramStore((s) => s.importDiagram)
  const undo = useDiagramStore((s) => s.undo)
  const redo = useDiagramStore((s) => s.redo)
  const selectTable = useEditorStore((s) => s.selectTable)
  const rightPanel = useEditorStore((s) => s.rightPanel)
  const selectedTableId = useEditorStore((s) => s.selectedTableId)
  const selectedRelationId = useEditorStore((s) => s.selectedRelationId)
  const setRightPanel = useEditorStore((s) => s.setRightPanel)
  const navigate = useNavigate()

  const [leftOpen, setLeftOpen] = useState(true)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    if (diagram && activeId !== diagramId) setActive(diagramId)
  }, [diagram, activeId, diagramId, setActive])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (e.key.toLowerCase() === "z" && e.shiftKey) ||
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault()
        redo()
      }
      if (e.key === "\\") {
        e.preventDefault()
        setLeftOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  const filteredTables = useMemo(() => {
    if (!diagram) return []
    const q = filter.trim().toLowerCase()
    if (!q) return diagram.tables
    return diagram.tables.filter((t) => t.name.toLowerCase().includes(q))
  }, [diagram, filter])

  if (!diagram) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Diagram not found
        </h1>
        <p className="text-base text-muted-foreground">
          It may have been deleted from this browser.
        </p>
        <Button onClick={() => navigate({ to: "/" })}>
          <HomeIcon data-icon="inline-start" />
          Back to projects
        </Button>
      </main>
    )
  }

  const selectedTable =
    diagram.tables.find((t) => t.id === selectedTableId) ?? null
  const selectedRelation =
    diagram.relations.find((r) => r.id === selectedRelationId) ?? null

  const activeRightPanel =
    rightPanel === "sql"
      ? "sql"
      : selectedTable
        ? "table"
        : selectedRelation
          ? "relation"
          : "none"

  async function handleImportJson() {
    const file = await pickJsonFile()
    if (!file) return
    try {
      const d = await importDiagramJson(file)
      const id = importDiagramToStore(d)
      toast.success(`Imported “${d.name}”`)
      navigate({ to: "/editor/$diagramId", params: { diagramId: id } })
    } catch (err) {
      toast.error("Import failed", { description: (err as Error).message })
    }
  }

  return (
    <main className="flex h-svh flex-col overflow-hidden bg-background">
      {/* App chrome */}
      <header className="flex h-16 items-center gap-2 border-b bg-toolbar px-4 text-toolbar-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="All diagrams"
              onClick={() => navigate({ to: "/" })}
            >
              <HomeIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>All diagrams</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle sidebar"
              onClick={() => setLeftOpen((v) => !v)}
            >
              <PanelLeftIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle sidebar</TooltipContent>
        </Tooltip>

        <div className="mx-2 h-6 w-px bg-border" />

        <ProjectSwitcher activeId={diagramId} />

        <Input
          value={diagram.name}
          onChange={(e) => renameDiagram(diagram.id, e.target.value)}
          placeholder="Diagram name"
          className="w-[260px] border-transparent bg-transparent text-base font-medium shadow-none hover:bg-accent/60 focus-visible:border-input focus-visible:bg-background"
        />

        <Select
          value={diagram.dialect}
          onValueChange={(v) => setDialect(v as Dialect)}
        >
          <SelectTrigger className="w-[148px] gap-1.5 border-transparent bg-transparent capitalize shadow-none hover:bg-accent/60 data-[state=open]:bg-accent/60">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIALECTS.map((d) => (
              <SelectItem key={d} value={d} className="capitalize">
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          variant={rightPanel === "sql" ? "secondary" : "ghost"}
          onClick={() => setRightPanel(rightPanel === "sql" ? "none" : "sql")}
        >
          <CodeIcon data-icon="inline-start" />
          SQL
        </Button>
        <Button variant="ghost" onClick={() => exportDiagramJson(diagram)}>
          <DownloadIcon data-icon="inline-start" />
          Export
        </Button>
        <Button variant="ghost" onClick={handleImportJson}>
          <UploadIcon data-icon="inline-start" />
          Import
        </Button>
        <div className="mx-2 h-6 w-px bg-border" />
        <ThemeToggle />
      </header>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1">
        {leftOpen && (
          <aside className="flex w-72 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
            <div className="flex h-14 items-center justify-between gap-2 px-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight">
                  Tables
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                  {diagram.tables.length}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const id = addTable()
                      selectTable(id)
                    }}
                    aria-label="Add table"
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add table</TooltipContent>
              </Tooltip>
            </div>

            <div className="px-4 pb-3">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search tables…"
                  className="bg-background pl-9"
                />
              </div>
            </div>

            <div className="h-px w-full bg-sidebar-border" />

            <ScrollArea className="flex-1">
              <ul className="flex flex-col gap-1 p-3">
                {filteredTables.length === 0 && (
                  <li className="px-3 py-10 text-center text-sm text-muted-foreground">
                    {filter ? "No matches." : "No tables yet."}
                  </li>
                )}
                {filteredTables.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => selectTable(t.id)}
                      className={cn(
                        "flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-base transition-colors",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        selectedTableId === t.id &&
                          "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      <TableIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{t.name}</span>
                      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
                        {t.columns.length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            <div className="border-t p-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const id = addTable()
                  selectTable(id)
                }}
              >
                <PlusIcon data-icon="inline-start" />
                New table
              </Button>
            </div>
          </aside>
        )}

        <section className="relative min-w-0 flex-1">
          <CanvasProvider>
            <CanvasToolbar diagram={diagram} />
            {diagram.tables.length === 0 && (
              <CanvasEmptyState
                onAdd={() => {
                  const id = addTable()
                  selectTable(id)
                }}
              />
            )}
            <DiagramCanvas diagram={diagram} />
          </CanvasProvider>
        </section>

        {activeRightPanel !== "none" && (
          <aside className="flex w-[380px] shrink-0 flex-col border-l bg-sidebar text-sidebar-foreground">
            <div className="flex h-14 items-center gap-2 border-b px-4">
              <span className="text-sm font-semibold tracking-tight">
                {activeRightPanel === "table"
                  ? "Table"
                  : activeRightPanel === "relation"
                    ? "Relation"
                    : "SQL"}
              </span>
              <div className="flex-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close panel"
                    onClick={() => {
                      if (activeRightPanel === "sql") setRightPanel("none")
                      else useEditorStore.getState().clearSelection()
                    }}
                  >
                    <PanelRightCloseIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close panel</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              {activeRightPanel === "table" && selectedTable && (
                <TableEditorPanel
                  table={selectedTable}
                  dialect={diagram.dialect}
                />
              )}
              {activeRightPanel === "relation" && selectedRelation && (
                <RelationEditorPanel
                  relation={selectedRelation}
                  diagram={diagram}
                />
              )}
              {activeRightPanel === "sql" && <SqlPanel diagram={diagram} />}
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}

function CanvasEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-1 flex items-center justify-center">
      <div className="pointer-events-auto flex flex-col items-center gap-4 rounded-xl border bg-elevated px-8 py-7 text-center shadow-tahoe-md">
        <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <TableIcon className="size-5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold tracking-tight">
            Your canvas is empty
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add a table or import SQL to start sketching your schema.
          </p>
        </div>
        <Button onClick={onAdd}>
          <PlusIcon data-icon="inline-start" />
          Add table
        </Button>
      </div>
    </div>
  )
}
