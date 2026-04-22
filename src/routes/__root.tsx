import { TanStackDevtools } from "@tanstack/react-devtools"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import { Providers } from "@/components/providers"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kiwi — Database Designer" },
      {
        name: "description",
        content:
          "Design database schemas visually with multi-dialect SQL import and export.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
        404
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body
        className="bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
