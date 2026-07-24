'use client';

import Link from 'next/link';
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

const DB_INSPECT_API_URL = process.env.NEXT_PUBLIC_DB_INSPECT_API_URL!;

export default function AdminDbPage() {
    const [payload, setPayload] = useState<DbInspectResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const sortedTables = useMemo(() => {
        if (!payload) {
            return [];
        }

        return [...payload.tables].sort((a, b) => b.rowCount - a.rowCount);
    }, [payload]);

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

    return (
        <main className="min-h-screen bg-yellow-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-6xl space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-stone-700">
                            Admin
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                            Database Snapshot
                        </h1>
                    </div>
                    <Link
                        href="/lobby"
                        className="border-2 border-neutral-600 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
                    >
                        Back to Lobby
                    </Link>
                </div>

                <p className="text-sm text-stone-600">
                    Read-only preview from API endpoint: {DB_INSPECT_API_URL}
                </p>

                {loading ? (
                    <p className="text-stone-700">
                        Loading database contents...
                    </p>
                ) : null}
                {error ? <p className="text-sm text-red-700">{error}</p> : null}

                {!loading && !error && payload ? (
                    <div className="space-y-4">
                        <div className="border-2 border-neutral-600 bg-amber-50 p-4 text-sm text-stone-900">
                            <p>Generated at: {payload.generatedAt}</p>
                            <p>Tables: {payload.tableCount}</p>
                            <p>
                                Max preview rows per table:{' '}
                                {payload.maxPreviewRows}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {sortedTables.map((table) => (
                                <Link
                                    key={table.name}
                                    href={`/admin/db/${encodeURIComponent(table.name)}`}
                                    className="border-2 border-neutral-600 bg-yellow-50 p-4 transition hover:border-stone-700 hover:bg-stone-50"
                                >
                                    <h2 className="text-base font-semibold text-stone-900">
                                        {table.name}
                                    </h2>
                                    <p className="mt-2 text-sm text-stone-700">
                                        Rows: {table.rowCount}
                                    </p>
                                    <p className="mt-1 text-xs text-stone-600">
                                        Click to view table data
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : null}
            </section>
        </main>
    );
}
