import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  PlayIcon,
  SaveIcon,
  SparklesIcon,
  XCircleIcon,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { mockQueryResult } from "./mock-data"
import { ChromeButton } from "./top-bar"
import type { QueryResult, QueryTab } from "./types"
import { useDataDeskStore } from "@/stores/datadesk-store"

interface QueryEditorProps {
  tab: QueryTab
}

type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; result: QueryResult }
  | { status: "error"; message: string }

export function QueryEditor({ tab }: QueryEditorProps) {
  const updateQueryTab = useDataDeskStore((s) => s.updateQueryTab)
  const [state, setState] = useState<ResultState>({
    status: "ok",
    result: mockQueryResult,
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const lineCount = useMemo(() => tab.sql.split("\n").length, [tab.sql])
  const highlighted = useMemo(() => highlightSql(tab.sql), [tab.sql])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && (e.key === "Enter" || e.key === "r")) {
        e.preventDefault()
        run()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function run() {
    setState({ status: "loading" })
    window.setTimeout(() => {
      if (/drop\s+table/i.test(tab.sql)) {
        setState({
          status: "error",
          message:
            "ERROR: permission denied for relation users\nHINT: GRANT the role 'app_admin' to your user.",
        })
      } else {
        setState({ status: "ok", result: mockQueryResult })
        toast.success(`Returned ${mockQueryResult.rows.length} rows`, {
          description: `${mockQueryResult.elapsedMs} ms`,
        })
      }
    }, 350)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <div className="flex h-10 shrink-0 items-center gap-1.5 border-b border-border bg-toolbar/60 px-2">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-400" />
          <input
            value={tab.title}
            onChange={(e) => updateQueryTab(tab.id, { title: e.target.value })}
            className="min-w-0 rounded bg-transparent px-1 font-mono text-[12.5px] font-medium tracking-tight outline-none focus:bg-background focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <ChromeButton title="Save query">
          <SaveIcon className="size-3.5" />
          <span className="text-[12px]">Save</span>
        </ChromeButton>
        <ChromeButton title="Format">
          <SparklesIcon className="size-3.5" />
          <span className="text-[12px]">Format</span>
        </ChromeButton>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden items-center gap-1 font-mono text-[10.5px] text-muted-foreground md:flex">
            <kbd className="rounded border border-border bg-muted/40 px-1 py-[1px] text-[10px]">
              ⌘ ↵
            </kbd>
            Run
          </span>
          <button
            type="button"
            onClick={run}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[12px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <PlayIcon className="size-3.5 fill-current" />
            Run query
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex min-h-[45%] flex-1 overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="h-full shrink-0 border-r border-border/70 bg-toolbar/40 px-2.5 py-3 text-right font-mono text-[11px] leading-5 text-muted-foreground/60 select-none"
          >
            {Array.from({ length: Math.max(lineCount, 12) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <div className="relative flex-1 overflow-auto">
            <pre
              aria-hidden
              className="pointer-events-none absolute inset-0 m-0 overflow-hidden px-4 py-3 font-mono text-[12.5px] leading-5 break-words whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
            <textarea
              ref={textareaRef}
              spellCheck={false}
              value={tab.sql}
              onChange={(e) => updateQueryTab(tab.id, { sql: e.target.value })}
              className="relative z-10 h-full min-h-full w-full resize-none bg-transparent px-4 py-3 font-mono text-[12.5px] leading-5 text-transparent caret-foreground outline-none selection:bg-primary/30"
            />
          </div>
        </div>

        <ResultsPanel state={state} tab={tab} />
      </div>
    </div>
  )
}

function ResultsPanel({ state, tab }: { state: ResultState; tab: QueryTab }) {
  return (
    <div className="flex min-h-[220px] flex-[0_0_45%] flex-col overflow-hidden bg-background">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-border bg-toolbar/40 px-2 font-mono text-[11px] text-muted-foreground">
        <ResultStatusBadge state={state} />
        {state.status === "ok" && (
          <>
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              {state.result.elapsedMs} ms
            </span>
            <span>· {state.result.rows.length} rows</span>
            <span>· 4 columns</span>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ChromeButton title="Copy results">
            <CopyIcon className="size-3.5" />
          </ChromeButton>
          <ChromeButton title="Export">
            <DownloadIcon className="size-3.5" />
          </ChromeButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {state.status === "ok" ? (
          <ResultsGrid result={state.result} />
        ) : state.status === "loading" ? (
          <LoadingState />
        ) : state.status === "error" ? (
          <ErrorState message={state.message} />
        ) : (
          <IdleState title={tab.title} />
        )}
      </div>
    </div>
  )
}

function ResultStatusBadge({ state }: { state: ResultState }) {
  if (state.status === "ok")
    return (
      <span className="flex items-center gap-1 text-emerald-400">
        <CheckCircle2Icon className="size-3.5" />
        <span className="text-foreground/90">Success</span>
      </span>
    )
  if (state.status === "error")
    return (
      <span className="flex items-center gap-1 text-red-400">
        <XCircleIcon className="size-3.5" />
        <span className="text-foreground/90">Error</span>
      </span>
    )
  if (state.status === "loading")
    return (
      <span className="flex items-center gap-1 text-amber-400">
        <span className="size-2 animate-pulse rounded-full bg-amber-400" />
        <span className="text-foreground/90">Running…</span>
      </span>
    )
  return <span>Idle</span>
}

function ResultsGrid({ result }: { result: QueryResult }) {
  return (
    <table className="min-w-full border-separate border-spacing-0 text-[12.5px]">
      <thead>
        <tr>
          <th className="sticky top-0 left-0 z-10 h-8 w-10 border-r border-b border-border/60 bg-toolbar/90 px-2 text-center font-mono text-[10px] text-muted-foreground/60 backdrop-blur" />
          {result.columns.map((c) => (
            <th
              key={c.name}
              className="sticky top-0 h-8 border-r border-b border-border/60 bg-toolbar/90 px-3 text-left font-normal backdrop-blur"
            >
              <div className="flex items-center gap-1.5 text-[12px] font-medium">
                <span className="font-mono tracking-tight">{c.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {c.type}
                </span>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {result.rows.map((r, idx) => (
          <tr key={r.id} className="group/r hover:bg-muted/40">
            <td className="h-8 w-10 border-r border-b border-border/40 bg-background px-2 text-center font-mono text-[10.5px] text-muted-foreground/60 group-hover/r:bg-muted/40">
              {idx + 1}
            </td>
            {result.columns.map((c) => {
              const v = r.values[c.name]
              return (
                <td
                  key={c.name}
                  className="h-8 border-r border-b border-border/40 px-3 font-mono text-[12.5px]"
                >
                  {v === null ? (
                    <span className="text-muted-foreground/50">NULL</span>
                  ) : typeof v === "number" && c.type.startsWith("num") ? (
                    formatNumeric(v)
                  ) : (
                    String(v)
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function formatNumeric(n: number) {
  if (n <= 1) return n.toFixed(3)
  return n.toLocaleString()
}

function LoadingState() {
  return (
    <div className="grid h-full place-items-center text-sm text-muted-foreground">
      <div className="flex items-center gap-2.5">
        <span className="size-2 animate-pulse rounded-full bg-amber-400" />
        Executing…
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-red-400">
        <AlertCircleIcon className="size-4" />
        <span className="text-[13px] font-medium">Query failed</span>
      </div>
      <pre className="min-w-0 rounded-md border border-red-500/20 bg-red-500/5 p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap text-red-300">
        {message}
      </pre>
    </div>
  )
}

function IdleState({ title }: { title: string }) {
  return (
    <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
      <div className="flex flex-col items-center gap-1">
        <PlayIcon className="size-5 text-muted-foreground/60" />
        <span className="font-medium text-foreground">{title}</span>
        <span className="font-mono text-[11px]">
          Press ⌘ ↵ to run this query.
        </span>
      </div>
    </div>
  )
}

const SQL_KEYWORDS = new Set([
  "select",
  "from",
  "where",
  "group",
  "by",
  "order",
  "asc",
  "desc",
  "limit",
  "offset",
  "join",
  "left",
  "right",
  "inner",
  "outer",
  "on",
  "as",
  "and",
  "or",
  "not",
  "in",
  "is",
  "null",
  "true",
  "false",
  "case",
  "when",
  "then",
  "else",
  "end",
  "insert",
  "into",
  "values",
  "update",
  "set",
  "delete",
  "create",
  "table",
  "drop",
  "alter",
  "add",
  "column",
  "distinct",
  "union",
  "all",
  "with",
  "having",
  "interval",
  "now",
])

const SQL_FUNCTIONS = new Set([
  "count",
  "sum",
  "avg",
  "min",
  "max",
  "coalesce",
  "date_trunc",
  "to_char",
  "extract",
  "lower",
  "upper",
  "length",
])

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function highlightSql(sql: string) {
  const escaped = escapeHtml(sql)
  const tokenRegex =
    /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g

  return escaped.replace(tokenRegex, (_match, comment, str, num, word) => {
    if (comment)
      return `<span class="text-muted-foreground/70 italic">${comment}</span>`
    if (str) return `<span class="text-emerald-400/90">${str}</span>`
    if (num) return `<span class="text-amber-300/90">${num}</span>`
    if (word) {
      const lower = word.toLowerCase()
      if (SQL_KEYWORDS.has(lower))
        return `<span class="text-primary font-semibold">${word}</span>`
      if (SQL_FUNCTIONS.has(lower))
        return `<span class="text-sky-300/90">${word}</span>`
      return `<span class="text-foreground">${word}</span>`
    }
    return _match
  })
}
