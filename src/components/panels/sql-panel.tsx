"use client"

import { CopyIcon, DownloadIcon, UploadIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DIALECTS, type Diagram, type Dialect } from "@/lib/types"
import { generateSql } from "@/lib/sql/generate"
import { parseSql } from "@/lib/sql/parse"
import { autoLayout } from "@/lib/auto-layout"
import { useDiagramStore } from "@/stores/diagram-store"

interface Props {
  diagram: Diagram
}

export function SqlPanel({ diagram }: Props) {
  const replace = useDiagramStore((s) => s.replaceTablesAndRelations)
  const setDialect = useDiagramStore((s) => s.setDialect)

  const [importDialect, setImportDialect] = useState<Dialect>(diagram.dialect)
  const [importText, setImportText] = useState("")

  const generated = useMemo(
    () => generateSql(diagram.dialect, diagram.tables, diagram.relations),
    [diagram.dialect, diagram.tables, diagram.relations]
  )

  async function handleCopy() {
    await navigator.clipboard.writeText(generated)
    toast.success("SQL copied to clipboard")
  }

  function handleDownload() {
    const blob = new Blob([generated], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${diagram.name || "schema"}.${diagram.dialect}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    const result = parseSql(importDialect, importText)
    if (result.tables.length === 0) {
      toast.error("No tables parsed", {
        description:
          result.warnings[0] ?? "Check the SQL syntax for this dialect.",
      })
      return
    }
    try {
      const laid = await autoLayout(result.tables, result.relations)
      replace(laid, result.relations)
    } catch {
      replace(result.tables, result.relations)
    }
    setDialect(importDialect)
    if (result.warnings.length > 0) {
      toast.warning(`Imported with ${result.warnings.length} warning(s)`, {
        description: result.warnings.slice(0, 3).join(" · "),
      })
    } else {
      toast.success(`Imported ${result.tables.length} table(s)`)
    }
  }

  return (
    <Tabs defaultValue="export" className="flex h-full flex-col">
      <div className="border-b px-5 pt-4 pb-4">
        <TabsList className="w-full">
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="export" className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Dialect
          </Label>
          <Select
            value={diagram.dialect}
            onValueChange={(v) => setDialect(v as Dialect)}
          >
            <SelectTrigger className="w-[170px]">
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
        </div>
        <ScrollArea className="flex-1 rounded-lg border bg-muted/30">
          <pre className="min-h-full p-4 font-mono text-sm leading-relaxed whitespace-pre">
            {generated}
          </pre>
        </ScrollArea>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCopy} className="flex-1">
            <CopyIcon data-icon="inline-start" />
            Copy
          </Button>
          <Button onClick={handleDownload} className="flex-1">
            <DownloadIcon data-icon="inline-start" />
            Download
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="import" className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Dialect
          </Label>
          <Select
            value={importDialect}
            onValueChange={(v) => setImportDialect(v as Dialect)}
          >
            <SelectTrigger className="w-[170px]">
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
        </div>
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste CREATE TABLE statements here…"
          className="min-h-48 flex-1 resize-none font-mono text-sm leading-relaxed"
        />
        <Button onClick={handleImport} disabled={!importText.trim()}>
          <UploadIcon data-icon="inline-start" />
          Replace schema with SQL
        </Button>
      </TabsContent>
    </Tabs>
  )
}
