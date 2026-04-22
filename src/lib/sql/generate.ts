import type { Dialect, Relation, Table } from '@/lib/types';

import { generateMysql } from './dialects/mysql';
import { generatePostgres } from './dialects/postgres';
import { generateSqlite } from './dialects/sqlite';

export function generateSql(
  dialect: Dialect,
  tables: Table[],
  relations: Relation[],
): string {
  if (tables.length === 0) return '-- no tables yet';
  switch (dialect) {
    case 'postgres':
      return generatePostgres(tables, relations);
    case 'mysql':
      return generateMysql(tables, relations);
    case 'sqlite':
      return generateSqlite(tables, relations);
  }
}
