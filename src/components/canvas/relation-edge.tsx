import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react"

import type { RelationType } from "@/lib/types"

export interface RelationEdgeData extends Record<string, unknown> {
  relationType: RelationType
  label?: string
}

function marker(type: RelationType, endpoint: "source" | "target"): string {
  if (type === "oneToOne") return "one"
  if (type === "oneToMany") return endpoint === "source" ? "one" : "many"
  return "many"
}

export function RelationEdge(props: EdgeProps & { data?: RelationEdgeData }) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
    style,
  } = props

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  })

  const type = data?.relationType ?? "oneToMany"

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected
            ? "var(--primary)"
            : "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
          strokeWidth: selected ? 2 : 1.5,
          ...style,
        }}
        markerStart={`url(#marker-${marker(type, "source")})`}
        markerEnd={`url(#marker-${marker(type, "target")})`}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="rounded-md border bg-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-tahoe-xs"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export function RelationEdgeMarkers() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        <marker
          id="marker-one"
          viewBox="0 0 20 20"
          refX="18"
          refY="10"
          markerWidth="16"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <line
            x1="14"
            y1="2"
            x2="14"
            y2="18"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="0"
            y1="10"
            x2="14"
            y2="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </marker>
        <marker
          id="marker-many"
          viewBox="0 0 20 20"
          refX="18"
          refY="10"
          markerWidth="16"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <line
            x1="0"
            y1="10"
            x2="18"
            y2="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="0"
            y1="10"
            x2="18"
            y2="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line
            x1="0"
            y1="10"
            x2="18"
            y2="18"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </marker>
      </defs>
    </svg>
  )
}
