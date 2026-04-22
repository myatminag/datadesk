import {
  PlusIcon,
  WavesIcon,
  TableIcon,
  UploadIcon,
  DownloadIcon,
  MoreHorizontalIcon,
  DatabaseIcon,
  ArrowUpRightIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useMemo } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"

import {
  pickJsonFile,
  importDiagramJson,
  exportDiagramJson,
} from "@/lib/storage"

import { useDiagramStore } from "@/stores/diagram-store"
import type { Diagram } from "@/lib/types"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const diagrams = useDiagramStore((s) => s.diagrams)
  const order = useDiagramStore((s) => s.order)
  const createDiagram = useDiagramStore((s) => s.createDiagram)
  const deleteDiagram = useDiagramStore((s) => s.deleteDiagram)
  const importDiagram = useDiagramStore((s) => s.importDiagram)
  const navigate = useNavigate()

  const list = useMemo(
    () => order.map((id) => diagrams[id]).filter(Boolean),
    [order, diagrams]
  )

  async function handleImport() {
    const file = await pickJsonFile()
    if (!file) return
    try {
      const diagram = await importDiagramJson(file)
      const id = importDiagram(diagram)
      toast.success(`Imported “${diagram.name}”`)
      navigate({ to: "/editor/$diagramId", params: { diagramId: id } })
    } catch (err) {
      toast.error("Import failed", {
        description: (err as Error).message,
      })
    }
  }

  function handleCreate() {
    const id = createDiagram("Untitled diagram")
    navigate({ to: "/editor/$diagramId", params: { diagramId: id } })
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-8">
          <BrandMark />
          <div className="flex-1" />
          <Button variant="outline" size="sm" asChild>
            <Link to="/datadesk">
              <DatabaseIcon data-icon="inline-start" />
              Open DataDesk
              <ArrowUpRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <div className="mx-1 h-6 w-px bg-border" />
          <Button variant="outline" onClick={handleImport}>
            <UploadIcon data-icon="inline-start" />
            Import
          </Button>
          <Button onClick={handleCreate}>
            <PlusIcon data-icon="inline-start" />
            New diagram
          </Button>
          <div className="mx-2 h-6 w-px bg-border" />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-8 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your diagrams
          </h1>
          <p className="text-base text-muted-foreground">
            {list.length === 0
              ? "Start a new schema or import an existing one."
              : `${list.length} ${list.length === 1 ? "diagram" : "diagrams"} in this browser.`}
          </p>
        </div>

        {list.length === 0 ? (
          <EmptyState onCreate={handleCreate} onImport={handleImport} />
        ) : (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((d) => (
              <DiagramCard
                key={d.id}
                diagram={d}
                onOpen={() =>
                  navigate({
                    to: "/editor/$diagramId",
                    params: { diagramId: d.id },
                  })
                }
                onDelete={() => {
                  deleteDiagram(d.id)
                  toast.success("Diagram deleted")
                }}
              />
            ))}
            <button
              type="button"
              onClick={handleCreate}
              className="group flex min-h-[208px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-transparent p-6 text-muted-foreground transition-colors hover:border-border hover:bg-accent/50 hover:text-foreground"
            >
              <div className="grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <PlusIcon className="size-5" />
              </div>
              <span className="text-base font-medium">New diagram</span>
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl border bg-card text-primary shadow-tahoe-xs">
        <WavesIcon className="size-5" strokeWidth={2.25} />
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className="text-lg font-semibold tracking-tight">Kiwi</span>
        <span className="text-sm text-muted-foreground">Database Designer</span>
      </div>
    </div>
  )
}

function DiagramCard({
  diagram,
  onOpen,
  onDelete,
}: {
  diagram: Diagram
  onOpen: () => void
  onDelete: () => void
}) {
  const updated = useMemo(
    () =>
      new Date(diagram.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    [diagram.updatedAt]
  )

  return (
    <div className="group relative flex min-h-[208px] flex-col justify-between rounded-xl border bg-card p-6 shadow-tahoe-xs transition-all hover:border-ring/30 hover:shadow-tahoe-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-col items-start gap-1.5 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div aria-hidden className="size-2.5 rounded-full bg-primary" />
          <span className="truncate text-lg font-semibold tracking-tight">
            {diagram.name}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Updated {updated}</p>
      </button>

      <div
        className="mt-6 flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
      >
        <Badge variant="secondary" className="capitalize">
          {diagram.dialect}
        </Badge>
        <span className="inline-flex items-center gap-1.5">
          <TableIcon className="size-3.5" />
          {diagram.tables.length}
        </span>
        <span className="text-border">·</span>
        <span>
          {diagram.relations.length}{" "}
          {diagram.relations.length === 1 ? "relation" : "relations"}
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="More"
            className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => exportDiagramJson(diagram)}>
            <DownloadIcon data-icon="inline-start" />
            Export JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => e.preventDefault()}
              >
                Delete
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete diagram?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes “{diagram.name}” from your browser
                  storage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function EmptyState({
  onCreate,
  onImport,
}: {
  onCreate: () => void
  onImport: () => void
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed bg-card/30 p-16 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <TableIcon className="size-6" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold tracking-tight">
          No diagrams yet
        </h2>
        <p className="max-w-md text-base text-muted-foreground">
          Create a new diagram to sketch your schema visually, generate SQL, or
          import an existing schema.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onImport}>
          <UploadIcon data-icon="inline-start" />
          Import JSON
        </Button>
        <Button onClick={onCreate}>
          <PlusIcon data-icon="inline-start" />
          New diagram
        </Button>
      </div>
    </section>
  )
}
