import ELK from 'elkjs/lib/elk.bundled.js';

import type { Relation, Table } from '@/lib/types';
import {
  TABLE_NODE_HEADER_HEIGHT,
  TABLE_NODE_ROW_HEIGHT,
  TABLE_NODE_WIDTH,
} from '@/components/canvas/table-node';

const elk = new ELK();

export async function autoLayout(
  tables: Table[],
  relations: Relation[],
): Promise<Table[]> {
  if (tables.length === 0) return tables;
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.spacing.nodeNode': '60',
    },
    children: tables.map((t) => ({
      id: t.id,
      width: TABLE_NODE_WIDTH,
      height: TABLE_NODE_HEADER_HEIGHT + t.columns.length * TABLE_NODE_ROW_HEIGHT + 8,
    })),
    edges: relations.map((r) => ({
      id: r.id,
      sources: [r.fromTableId],
      targets: [r.toTableId],
    })),
  };

  const result = await elk.layout(graph);
  const positions = new Map<string, { x: number; y: number }>();
  for (const child of result.children ?? []) {
    if (child.id && child.x != null && child.y != null) {
      positions.set(child.id, { x: child.x, y: child.y });
    }
  }
  return tables.map((t) => ({
    ...t,
    position: positions.get(t.id) ?? t.position,
  }));
}
