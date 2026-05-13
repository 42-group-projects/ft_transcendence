import {
    getTablePreviewRows,
    getTableRowCount,
    listPublicTableNames,
} from '../repository/adminRepository';
import { createDbClient } from '../repository/dbClient';

export type DbTableDump = {
    name: string;
    rowCount: number;
    rows: Record<string, unknown>[];
};

export type DbInspectResult = {
    generatedAt: string;
    tableCount: number;
    maxPreviewRows: number;
    tables: DbTableDump[];
};

export async function getDbInspectSnapshot(
    maxPreviewRows = 100,
): Promise<DbInspectResult> {
    const dbClient = createDbClient();

    try {
        const tableNames = await listPublicTableNames(dbClient.db);
        const tables: DbTableDump[] = [];

        for (const tableName of tableNames) {
            const rowCount = await getTableRowCount(dbClient.db, tableName);
            const rows = await getTablePreviewRows(
                dbClient.db,
                tableName,
                maxPreviewRows,
            );

            tables.push({
                name: tableName,
                rowCount,
                rows,
            });
        }

        return {
            generatedAt: new Date().toISOString(),
            tableCount: tables.length,
            maxPreviewRows,
            tables,
        };
    } finally {
        await dbClient.close();
    }
}
