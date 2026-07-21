'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type DbTableDump = {
    name: string;
    rowCount: number;
    rows: Record<string, unknown>[];
};

type DbInspectResponse = {
    generatedAt: string;
    tableCount: number;
    maxPreviewRows: number;
    tables: DbTableDump[];
};

const DB_INSPECT_API_URL =
    process.env.NEXT_PUBLIC_DB_INSPECT_API_URL ?? '/api/admin/db';

function formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '-';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value);
    }

    try {
        return JSON.stringify(value);
    } catch {
        return '[unserializable]';
    }
}

export default function AdminDbTablePage() {
    const params = useParams<{ tableName: string }>();
    const tableName = decodeURIComponent(params.tableName);

    const [payload, setPayload] = useState<DbInspectResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
        {},
    );

    useEffect(() => {
        let cancelled = false;

        const loadDbSnapshot = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(DB_INSPECT_API_URL, {
                    method: 'GET',
                    cache: 'no-store',
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        (data as { error?: string }).error ??
                            'Failed to fetch DB snapshot',
                    );
                }

                if (!cancelled) {
                    setPayload(data as DbInspectResponse);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : 'Unknown error',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadDbSnapshot();

        return () => {
            cancelled = true;
        };
    }, []);

    const selectedTable = useMemo(() => {
        if (!payload) {
            return null;
        }

        return payload.tables.find((table) => table.name === tableName) ?? null;
    }, [payload, tableName]);

    const columns = useMemo(() => {
        if (!selectedTable) {
            return [];
        }

        return Array.from(
            selectedTable.rows.reduce((keys, row) => {
                Object.keys(row).forEach((key) => keys.add(key));
                return keys;
            }, new Set<string>()),
        );
    }, [selectedTable]);

    useEffect(() => {
        if (columns.length === 0) {
            setColumnFilters({});
            return;
        }

        setColumnFilters((prev) => {
            const next: Record<string, string> = {};
            for (const column of columns) {
                next[column] = prev[column] ?? '';
            }
            return next;
        });
    }, [columns]);

    const filteredRows = useMemo(() => {
        if (!selectedTable) {
            return [];
        }

        return selectedTable.rows.filter((row) => {
            return columns.every((column) => {
                const query = (columnFilters[column] ?? '')
                    .trim()
                    .toLowerCase();
                if (!query) {
                    return true;
                }

                return formatCellValue(row[column])
                    .toLowerCase()
                    .includes(query);
            });
        });
    }, [selectedTable, columns, columnFilters]);

    return (
        <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-7xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
                            Admin
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            Table: {tableName}
                        </h1>
                    </div>
                    <Link
                        href="/admin/db"
                        className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-900"
                    >
                        Back to Table List
                    </Link>
                </div>

                {loading ? (
                    <p className="text-neutral-300">Loading table data...</p>
                ) : null}
                {error ? <p className="text-sm text-red-400">{error}</p> : null}

                {!loading && !error && !selectedTable ? (
                    <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
                        Table not found: {tableName}
                    </div>
                ) : null}

                {!loading && !error && selectedTable ? (
                    <article className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-neutral-100">
                                {selectedTable.name}
                            </h2>
                            <span className="rounded bg-neutral-800 px-2 py-1 text-xs text-neutral-300">
                                {selectedTable.rowCount} rows
                            </span>
                        </div>

                        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                            <span>
                                Showing {filteredRows.length} /{' '}
                                {selectedTable.rowCount} rows
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const reset: Record<string, string> = {};
                                    for (const column of columns) {
                                        reset[column] = '';
                                    }
                                    setColumnFilters(reset);
                                }}
                                className="rounded border border-neutral-700 px-2 py-1 text-neutral-300 transition hover:bg-neutral-800"
                            >
                                Clear filters
                            </button>
                        </div>

                        {selectedTable.rows.length === 0 ? (
                            <p className="text-sm text-neutral-500">No rows</p>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
                                <div className="max-h-[70vh] overflow-auto">
                                    <table className="w-full min-w-max border-collapse text-left text-xs text-neutral-200">
                                        <thead className="sticky top-0 bg-neutral-900 text-neutral-300">
                                            <tr>
                                                {columns.map((column) => (
                                                    <th
                                                        key={column}
                                                        className="border-b border-neutral-800 px-3 py-2 font-medium uppercase tracking-wide"
                                                    >
                                                        {column}
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr>
                                                {columns.map((column) => (
                                                    <th
                                                        key={`${column}-filter`}
                                                        className="border-b border-neutral-800 bg-neutral-900 px-3 py-2"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={
                                                                columnFilters[
                                                                    column
                                                                ] ?? ''
                                                            }
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                const value =
                                                                    event.target
                                                                        .value;
                                                                setColumnFilters(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [column]:
                                                                            value,
                                                                    }),
                                                                );
                                                            }}
                                                            placeholder={`Search ${column}`}
                                                            className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-xs font-normal text-neutral-200 outline-none transition focus:border-neutral-500"
                                                        />
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredRows.map(
                                                (row, rowIndex) => (
                                                    <tr
                                                        key={`${selectedTable.name}-${rowIndex}`}
                                                        className="odd:bg-neutral-950 even:bg-neutral-900/40"
                                                    >
                                                        {columns.map(
                                                            (column) => (
                                                                <td
                                                                    key={`${selectedTable.name}-${rowIndex}-${column}`}
                                                                    className="border-b border-neutral-900 px-3 py-2 align-top font-mono"
                                                                >
                                                                    {formatCellValue(
                                                                        row[
                                                                            column
                                                                        ],
                                                                    )}
                                                                </td>
                                                            ),
                                                        )}
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </article>
                ) : null}
            </section>
        </main>
    );
}
