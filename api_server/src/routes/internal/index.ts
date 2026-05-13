import { Hono } from 'hono';
import { createDbClient } from '../../repository/dbClient';
import {
    MatchResultValidationError,
    matchRepository,
} from '../../repository/matchRepository';

export const internalRoutes = new Hono();

function parseStartedAt(value: unknown) {
    if (value === undefined) {
        return new Date();
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
        return null;
    }

    const startedAt = new Date(value);
    return Number.isFinite(startedAt.getTime()) ? startedAt : null;
}

/**
 * POST /api/internal/match-result
 *
 * Called by the socket server after a game_finished session ends.
 * Body: { player1Id, player2Id?, winnerId?, isCpuGame, cpuLevel?, startedAt }
 */
internalRoutes.post('/match-result', async (c) => {
    try {
        const body = await c.req.json().catch(() => null);
        if (!body) return c.json({ error: 'UNPROCESSABLE' }, 422);

        const {
            player1Id,
            player2Id,
            winnerId,
            isCpuGame,
            cpuLevel,
            startedAt,
        } = body;

        if (typeof player1Id !== 'string' || typeof isCpuGame !== 'boolean') {
            return c.json({ error: 'UNPROCESSABLE' }, 422);
        }

        if (
            winnerId !== undefined &&
            winnerId !== null &&
            typeof winnerId !== 'string'
        ) {
            return c.json({ error: 'UNPROCESSABLE' }, 422);
        }

        if (
            (player2Id !== undefined && player2Id !== null
                ? typeof player2Id !== 'string'
                : false) ||
            (cpuLevel !== undefined && cpuLevel !== null
                ? typeof cpuLevel !== 'string'
                : false)
        ) {
            return c.json({ error: 'UNPROCESSABLE' }, 422);
        }

        const parsedStartedAt = parseStartedAt(startedAt);
        if (!parsedStartedAt) {
            return c.json({ error: 'UNPROCESSABLE' }, 422);
        }

        const { db, close } = createDbClient();
        try {
            await matchRepository.saveMatchResult(db, {
                player1Id,
                player2Id: player2Id ?? null,
                winnerId: winnerId ?? null,
                isCpuGame,
                cpuLevel: cpuLevel ?? null,
                startedAt: parsedStartedAt,
            });
            return c.json({ ok: true });
        } finally {
            await close();
        }
    } catch (err) {
        if (err instanceof MatchResultValidationError) {
            return c.json({ error: 'UNPROCESSABLE' }, 422);
        }
        console.error('[POST /internal/match-result]', err);
        return c.json({ error: 'INTERNAL_ERROR' }, 500);
    }
});
