import { createFileRoute } from "@tanstack/react-router"

import { DataDeskAppShell } from "@/components/datadesk/app-shell"

export const Route = createFileRoute("/datadesk")({
  head: () => ({
    meta: [
      { title: "DataDesk" },
      {
        name: "description",
        content:
          "A modern, keyboard-first database client for PostgreSQL, MySQL, SQLite and more.",
      },
    ],
  }),
  component: DataDeskScreen,
})

function DataDeskScreen() {
  return <DataDeskAppShell />
}
