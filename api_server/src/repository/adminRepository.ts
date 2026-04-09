import { sql } from "drizzle-orm";
import type { AppDb } from "./dbClient";

export async function listPublicTableNames(db: AppDb): Promise<string[]> {
  const rows = await db.execute<{ table_name: string }>(sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name asc
  `);

  return rows
    .map((row) => row.table_name)
    .filter((name) => /^[a-zA-Z0-9_]+$/.test(name));
}

export async function getTableRowCount(db: AppDb, tableName: string): Promise<number> {
  const safeTableName = tableName.replace(/"/g, '""');
  const rows = await db.execute<{ count: string }>(
    sql.raw(`select count(*)::text as count from "${safeTableName}"`)
  );
  const count = rows[0]?.count ?? "0";

  return Number(count);
}

export async function getTablePreviewRows(
  db: AppDb,
  tableName: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const safeTableName = tableName.replace(/"/g, '""');
  return db.execute<Record<string, unknown>>(
    sql.raw(`select * from "${safeTableName}" limit ${Math.max(0, Math.floor(limit))}`)
  );
}
