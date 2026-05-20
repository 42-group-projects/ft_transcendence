import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createDbClient } from '../../repository/dbClient';
import {
    MatchResultValidationError,
    matchRepository,
} from '../../repository/matchRepository';
import { matchResultSchema } from './schemas';

export const internalRoutes = new Hono();

/**
 * POST /api/internal/match-result
 *
 * Called by the socket server after a game_finished session ends.
 * Body: { player1Id, player2Id?, winnerId, isCpuGame, cpuLevel?, startedAt? }
 */
internalRoutes.post(
    '/match-result',
    zValidator('json', matchResultSchema),
    async (c) => {
        try {
            const {
                player1Id,
                player2Id,
                winnerId,
                isCpuGame,
                cpuLevel,
                startedAt,
            } = c.req.valid('json');

            // Parse startedAt: use provided value or current date
            let parsedStartedAt: Date;
            if (startedAt === undefined) {
                parsedStartedAt = new Date();
            } else if (typeof startedAt === 'string') {
                parsedStartedAt = new Date(startedAt);
            } else {
                parsedStartedAt = new Date(startedAt);
            }

            const { db, close } = createDbClient();
            try {
                await matchRepository.saveMatchResult(db, {
                    player1Id,
                    player2Id: player2Id ?? null,
                    winnerId,
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
    },
);
