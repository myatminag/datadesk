"use client"

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react"
import { useCallback, useMemo } from "react"

import "@xyflow/react/dist/style.css"

import type { Diagram } from "@/lib/types"
import { useDiagramStore } from "@/stores/diagram-store"
import { useEditorStore } from "@/stores/editor-store"
import { TableNode, type TableNodeData } from "./table-node"
import {
  RelationEdge,
  RelationEdgeMarkers,
  type RelationEdgeData,
} from "./relation-edge"

const nodeTypes: NodeTypes = { table: TableNode }
const edgeTypes: EdgeTypes = { relation: RelationEdge }

function getHandleColumnId(handleId: string | null | undefined): string | null {
  if (!handleId) return null
  if (handleId.endsWith("-l")) return handleId.slice(0, -2)
  if (handleId.endsWith("-r")) return handleId.slice(0, -2)
  return handleId
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}

export function DiagramCanvas({ diagram }: { diagram: Diagram }) {
  const setTablePosition = useDiagramStore((s) => s.setTablePosition)
  const addRelation = useDiagramStore((s) => s.addRelation)
  const deleteTable = useDiagramStore((s) => s.deleteTable)
  const deleteRelation = useDiagramStore((s) => s.deleteRelation)
  const selectTable = useEditorStore((s) => s.selectTable)
  const selectRelation = useEditorStore((s) => s.selectRelation)
  const clearSelection = useEditorStore((s) => s.clearSelection)
  const selectedTableId = useEditorStore((s) => s.selectedTableId)
  const selectedRelationId = useEditorStore((s) => s.selectedRelationId)

  const nodes = useMemo<Node<TableNodeData>[]>(
    () =>
      diagram.tables.map((t) => ({
        id: t.id,
        type: "table",
        position: t.position,
        data: { table: t },
        selected: t.id === selectedTableId,
      })),
    [diagram.tables, selectedTableId]
  )

  const edges = useMemo<Edge<RelationEdgeData>[]>(
    () =>
      diagram.relations.map((r) => ({
        id: r.id,
        source: r.fromTableId,
        target: r.toTableId,
        sourceHandle: `${r.fromColumnId}-r`,
        targetHandle: `${r.toColumnId}-l`,
        type: "relation",
        data: { relationType: r.type, label: r.name },
        selected: r.id === selectedRelationId,
      })),
    [diagram.relations, selectedRelationId]
  )

  const onNodesChange = useCallback<OnNodesChange>(
    (changes: NodeChange[]) => {
      for (const change of changes) {
        if (change.type === "position" && change.position) {
          setTablePosition(change.id, change.position)
        }
        if (change.type === "remove") {
          deleteTable(change.id)
        }
      }
    },
    [setTablePosition, deleteTable]
  )

  const onEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      for (const change of changes) {
        if (change.type === "remove") deleteRelation(change.id)
      }
    },
    [deleteRelation]
  )

  const onConnect = useCallback<OnConnect>(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      const fromCol = getHandleColumnId(connection.sourceHandle)
      const toCol = getHandleColumnId(connection.targetHandle)
      if (!fromCol || !toCol) return
      addRelation({
        fromTableId: connection.source,
        fromColumnId: fromCol,
        toTableId: connection.target,
        toColumnId: toCol,
        type: "oneToMany",
      })
    },
    [addRelation]
  )

  return (
    <div className="relative size-full">
      <RelationEdgeMarkers />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectTable(node.id)}
        onEdgeClick={(_, edge) => selectRelation(edge.id)}
        onPaneClick={() => clearSelection()}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
        proOptions={{ hideAttribution: true }}
        snapToGrid
        snapGrid={[8, 8]}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-background"
      >
        <Background
          gap={24}
          size={1}
          color="color-mix(in oklab, var(--muted-foreground) 18%, transparent)"
        />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          style={{ width: 144, height: 88 }}
          maskColor="color-mix(in oklch, var(--background) 70%, transparent)"
          nodeColor="var(--muted-foreground)"
          nodeStrokeWidth={0}
          className="overflow-hidden! rounded-md! border! bg-toolbar! shadow-tahoe-sm!"
        />
        <Controls
          position="bottom-left"
          showInteractive={false}
          className="overflow-hidden! rounded-md! border! bg-toolbar! text-toolbar-foreground! shadow-tahoe-sm!"
        />
      </ReactFlow>
    </div>
  )
}
