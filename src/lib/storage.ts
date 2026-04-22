import { diagramSchema, type Diagram } from "@/lib/types"

export function exportDiagramJson(diagram: Diagram): void {
  const blob = new Blob([JSON.stringify(diagram, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `${safeFilename(diagram.name)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export async function importDiagramJson(file: File): Promise<Diagram> {
  const text = await file.text()
  const data = JSON.parse(text)
  return diagramSchema.parse(data)
}

export function pickJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json,.json"
    input.onchange = () => {
      const file = input.files?.[0] ?? null
      resolve(file)
    }
    input.click()
  })
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 64) || "diagram"
}
