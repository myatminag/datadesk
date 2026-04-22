# Kiwi — Database Designer

A browser-based database schema designer. Draw tables and relationships on an
infinite canvas, import/export SQL for Postgres, MySQL and SQLite, and keep
everything local in your browser.

## Stack

- **TanStack Start** (Vite + TanStack Router, React 18, TypeScript strict)
- **React Flow** (`@xyflow/react`) for the diagram canvas
- **Zustand** (with `persist`) for diagram state + undo/redo
- **shadcn/ui** (Luma style) + **TailwindCSS** for the UI
- **React Hook Form** + **Zod** for forms/validation
- **node-sql-parser** for multi-dialect DDL parsing
- **elkjs** for auto-layout
- **html-to-image** for PNG export
- **next-themes** for dark mode

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Scripts

- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run typecheck` — type check the project
- `npm run lint` — lint
- `npm run format` — format with prettier

## Features

- Visual schema editor with per-column handles and crow's-foot relations
- Multi-dialect **SQL export** (Postgres/MySQL/SQLite) and **SQL import**
- **JSON import/export** with Zod validation
- **Auto-layout** (elkjs), **PNG export**, **Undo/Redo** (⌘Z / ⌘⇧Z)
- **Dark mode** (system/light/dark)
- Fully local — diagrams persist in `localStorage`

## Project layout

```
src/
  routes/              # TanStack Router file routes
    __root.tsx
    index.tsx          # project list
    editor.$diagramId.tsx
  components/
    canvas/            # React Flow nodes, edges, toolbar
    panels/            # table/relation editors, SQL panel, project switcher
    ui/                # shadcn primitives
  stores/
    diagram-store.ts   # persisted diagrams + undo/redo
    editor-store.ts    # UI selection
  lib/
    sql/
      generate.ts      # dispatcher
      dialects/        # postgres / mysql / sqlite emitters
      parse.ts         # node-sql-parser → Diagram
    types.ts           # Zod schemas + TS types
    storage.ts         # JSON file download/upload
    auto-layout.ts     # elkjs wrapper
    id.ts              # createId helper
```
