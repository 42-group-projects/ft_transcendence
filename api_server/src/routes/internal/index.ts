import { Hono } from 'hono';
import { createDbClient } from '../../repository/dbClient';
import { matchRepository } from '../../repository/matchRepository';

export const internalRoutes = new Hono();

/**
 * POST /api/internal/match-result
 *
 * Called by the socket server after a game_finished session ends.
 * Body: { player1Id, player2Id?, winnerId, isCpuGame, cpuLevel?, startedAt }
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

        if (
            typeof player1Id !== 'string' ||
            typeof winnerId !== 'string' ||
            typeof isCpuGame !== 'boolean'
        ) {
            return c.json({ error: 'UNPROCESSABLE' }, 422);
        }

        const { db, close } = createDbClient();
        try {
            await matchRepository.saveMatchResult(db, {
                player1Id,
                player2Id: player2Id ?? null,
                winnerId,
                isCpuGame,
                cpuLevel: cpuLevel ?? null,
                startedAt: startedAt ? new Date(startedAt) : new Date(),
            });
            return c.json({ ok: true });
        } finally {
            await close();
        }
    } catch (err) {
        console.error('[POST /internal/match-result]', err);
        return c.json({ error: 'INTERNAL_ERROR' }, 500);
    }
});
