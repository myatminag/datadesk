import { DatabaseIcon, EyeIcon, EyeOffIcon, PlayIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import type { Connection, DatabaseEngine } from "./types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useDataDeskStore } from "@/stores/datadesk-store"

const engines: Array<{
  id: DatabaseEngine
  label: string
  defaultPort: string
  color: string
}> = [
  {
    id: "postgres",
    label: "PostgreSQL",
    defaultPort: "5432",
    color: "#31648C",
  },
  { id: "mysql", label: "MySQL", defaultPort: "3306", color: "#CC7B2A" },
  { id: "sqlite", label: "SQLite", defaultPort: "", color: "#6B7280" },
  { id: "mssql", label: "SQL Server", defaultPort: "1433", color: "#A13B3B" },
  { id: "redis", label: "Redis", defaultPort: "6379", color: "#A43536" },
]

interface FormState {
  name: string
  engine: DatabaseEngine
  host: string
  port: string
  database: string
  username: string
  password: string
  ssl: boolean
  savePassword: boolean
}

const emptyForm: FormState = {
  name: "",
  engine: "postgres",
  host: "localhost",
  port: "5432",
  database: "",
  username: "",
  password: "",
  ssl: true,
  savePassword: true,
}

export function ConnectionModal() {
  const isOpen = useDataDeskStore((s) => s.isConnectionModalOpen)
  const editingId = useDataDeskStore((s) => s.editingConnectionId)
  const connections = useDataDeskStore((s) => s.connections)
  const close = useDataDeskStore((s) => s.closeConnectionModal)
  const upsert = useDataDeskStore((s) => s.upsertConnection)

  const [form, setForm] = useState<FormState>(emptyForm)
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  )

  useEffect(() => {
    if (!isOpen) return
    if (editingId) {
      const conn = connections.find((c) => c.id === editingId)
      if (conn) {
        const parts = conn.host.split(":")
        setForm({
          name: conn.name,
          engine: conn.engine,
          host: parts.at(0) ?? "",
          port:
            parts.at(1) ??
            engines.find((e) => e.id === conn.engine)?.defaultPort ??
            "",
          database: conn.database,
          username: "app_user",
          password: "••••••••",
          ssl: true,
          savePassword: true,
        })
      }
    } else {
      setForm(emptyForm)
    }
    setTesting("idle")
  }, [isOpen, editingId, connections])

  function patch<TKey extends keyof FormState>(
    key: TKey,
    value: FormState[TKey]
  ) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function testConnection() {
    setTesting("loading")
    window.setTimeout(() => {
      const ok =
        form.host.length > 0 &&
        form.database.length > 0 &&
        form.username.length > 0
      setTesting(ok ? "ok" : "error")
      if (ok) toast.success("Connection test succeeded")
      else
        toast.error("Connection test failed", {
          description: "Missing required fields",
        })
    }, 500)
  }

  function save() {
    if (!form.name || !form.host || !form.database) {
      toast.error("Fill in name, host, and database")
      return
    }
    const conn: Connection = {
      id: editingId ?? `conn-${Date.now().toString(36)}`,
      name: form.name,
      engine: form.engine,
      host: form.port ? `${form.host}:${form.port}` : form.host,
      database: form.database,
      status: "connected",
      tables: connections.find((c) => c.id === editingId)?.tables ?? [],
    }
    upsert(conn)
    close()
    toast.success(
      editingId ? `Updated ${conn.name}` : `Connected to ${conn.name}`
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (!v ? close() : null)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DatabaseIcon className="size-4 text-primary" />
            {editingId ? "Edit connection" : "New connection"}
          </DialogTitle>
          <DialogDescription>
            Credentials are stored in your system keychain when
            <span className="mx-1 font-medium text-foreground">
              Save password
            </span>
            is enabled.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <Label>Engine</Label>
            <div className="mt-1.5 grid grid-cols-5 gap-1.5">
              {engines.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    patch("engine", e.id)
                    if (e.defaultPort) patch("port", e.defaultPort)
                  }}
                  data-selected={form.engine === e.id}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 rounded-md border border-border/80 bg-background/50 text-[11px] font-medium text-muted-foreground transition-all",
                    "hover:border-ring/40 hover:text-foreground",
                    "data-[selected=true]:border-primary data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                  )}
                >
                  <span
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: e.color }}
                    aria-hidden
                  />
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Name</Label>
              <Input
                value={form.name}
                placeholder="production"
                onChange={(e) => patch("name", e.target.value)}
              />
            </Field>
            <Field>
              <Label>Database</Label>
              <Input
                value={form.database}
                placeholder="shop_prod"
                onChange={(e) => patch("database", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-[1fr_100px] gap-3">
            <Field>
              <Label>Host</Label>
              <Input
                value={form.host}
                placeholder="db.prod.internal"
                onChange={(e) => patch("host", e.target.value)}
              />
            </Field>
            <Field>
              <Label>Port</Label>
              <Input
                value={form.port}
                inputMode="numeric"
                onChange={(e) => patch("port", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <Label>Username</Label>
              <Input
                value={form.username}
                onChange={(e) => patch("username", e.target.value)}
              />
            </Field>
            <Field>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => patch("password", e.target.value)}
                  className="pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-3.5" />
                  ) : (
                    <EyeIcon className="size-3.5" />
                  )}
                </button>
              </div>
            </Field>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <Toggle
              checked={form.ssl}
              onChange={(v) => patch("ssl", v)}
              label="Require SSL"
            />
            <Toggle
              checked={form.savePassword}
              onChange={(v) => patch("savePassword", v)}
              label="Save password"
            />
          </div>
        </div>

        <DialogFooter className="flex-row items-center">
          <TestResult state={testing} />
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" size="sm" onClick={testConnection}>
              <PlayIcon data-icon="inline-start" />
              Test
            </Button>
            <Button variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              {editingId ? "Save" : "Connect"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TestResult({ state }: { state: "idle" | "loading" | "ok" | "error" }) {
  if (state === "idle") return <span />
  if (state === "loading")
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-amber-400" />
        Testing…
      </span>
    )
  if (state === "ok")
    return (
      <span className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-400">
        <span className="size-2 rounded-full bg-emerald-400" />
        Connection successful
      </span>
    )
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-medium text-red-400">
      <span className="size-2 rounded-full bg-red-500" />
      Could not connect
    </span>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-medium tracking-[0.02em] text-muted-foreground uppercase">
      {children}
    </label>
  )
}

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-md border border-border/80 bg-background/50 px-3 font-mono text-[12.5px] text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground/70",
        "focus:border-ring focus:bg-background focus:ring-[3px] focus:ring-ring/25",
        className
      )}
    />
  )
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-[12px] font-medium text-foreground/90"
    >
      <span
        className={cn(
          "relative h-4 w-7 rounded-full border transition-colors",
          checked ? "border-primary bg-primary" : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-background shadow-sm transition-all",
            checked ? "left-[14px]" : "left-[1px]"
          )}
        />
      </span>
      {label}
    </button>
  )
}
