import type { Column, Relation, Table } from '@/lib/types';

function quote(id: string) {
  return `\`${id.replace(/`/g, '``')}\``;
}

function columnLine(col: Column): string {
  const parts: string[] = [quote(col.name), col.type];
  if (!col.nullable) parts.push('NOT NULL');
  if (col.isAutoIncrement) parts.push('AUTO_INCREMENT');
  if (col.isUnique && !col.isPrimary) parts.push('UNIQUE');
  if (col.default !== undefined && col.default !== '') {
    parts.push(`DEFAULT ${col.default}`);
  }
  return parts.join(' ');
}

function primaryKeyClause(table: Table): string | null {
  const pk = table.columns.filter((c) => c.isPrimary);
  if (pk.length === 0) return null;
  return `PRIMARY KEY (${pk.map((c) => quote(c.name)).join(', ')})`;
}

function relationsFor(
  table: Table,
  tables: Table[],
  relations: Relation[],
): string[] {
  const lines: string[] = [];
  for (const r of relations) {
    if (r.fromTableId !== table.id) continue;
    const toTable = tables.find((t) => t.id === r.toTableId);
    const fromCol = table.columns.find((c) => c.id === r.fromColumnId);
    const toCol = toTable?.columns.find((c) => c.id === r.toColumnId);
    if (!toTable || !fromCol || !toCol) continue;
    const name = r.name ?? `fk_${table.name}_${fromCol.name}`;
    const parts = [
      `CONSTRAINT ${quote(name)}`,
      `FOREIGN KEY (${quote(fromCol.name)})`,
      `REFERENCES ${quote(toTable.name)} (${quote(toCol.name)})`,
    ];
    if (r.onDelete) parts.push(`ON DELETE ${r.onDelete.toUpperCase()}`);
    if (r.onUpdate) parts.push(`ON UPDATE ${r.onUpdate.toUpperCase()}`);
    lines.push(parts.join(' '));
  }
  return lines;
}

export function generateMysql(tables: Table[], relations: Relation[]): string {
  const out: string[] = [];
  for (const table of tables) {
    const lines: string[] = [];
    for (const col of table.columns) lines.push('  ' + columnLine(col));
    const pk = primaryKeyClause(table);
    if (pk) lines.push('  ' + pk);
    for (const rel of relationsFor(table, tables, relations)) lines.push('  ' + rel);
    out.push(
      `CREATE TABLE ${quote(table.name)} (\n${lines.join(',\n')}\n) ENGINE=InnoDB;`,
    );
  }
  return out.join('\n\n');
}
