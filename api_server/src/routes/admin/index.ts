import { Hono } from "hono";
import postgres from "postgres";

type DbTableDump = {
  name: string;
  rowCount: number;
  rows: Record<string, unknown>[];
};

const DATABASE_URL = process.env.DATABASE_URL;
const MAX_PREVIEW_ROWS = 100;

const app = new Hono().get("/db", async (c) => {
  if (!DATABASE_URL) {
    return c.json({ error: "DATABASE_URL is not set" }, 500);
  }

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    const tableNamesResult = await sql<{ table_name: string }[]>`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name asc
    `;

    const tables: DbTableDump[] = [];

    for (const row of tableNamesResult) {
      const tableName = row.table_name;
      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        continue;
      }

      const [{ count }] = await sql.unsafe<{ count: string }[]>(
        `select count(*)::text as count from "${tableName}"`
      );

      const rows = await sql.unsafe<Record<string, unknown>[]>(
        `select * from "${tableName}" limit ${MAX_PREVIEW_ROWS}`
      );

      tables.push({
        name: tableName,
        rowCount: Number(count),
        rows,
      });
    }

    return c.json({
      generatedAt: new Date().toISOString(),
      tableCount: tables.length,
      maxPreviewRows: MAX_PREVIEW_ROWS,
      tables,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to inspect database";
    return c.json({ error: message }, 500);
  } finally {
    await sql.end();
  }
});

export { app as adminRoutes };
