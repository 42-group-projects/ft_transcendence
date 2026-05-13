import { Hono } from 'hono';
import {
    createMockScore,
    type CreateMockScoreInput,
} from '../../../service/mockAnalysisService';

type CreateMockScoreBody = CreateMockScoreInput;

const app = new Hono()
    .get('/', (c) => {
        return c.json({
            message: 'mock analysis route ready',
            usage: 'POST /api/mock/analysis/scores',
        });
    })
    .post('/scores', async (c) => {
        const body = (await c.req
            .json()
            .catch(() => null)) as CreateMockScoreBody | null;

        if (!body) {
            return c.json({ error: 'Invalid JSON body' }, 400);
        }

        const p1 = body.player1Nickname?.trim();
        const p2 = body.player2Nickname?.trim();

        if (
            !p1 ||
            !p2 ||
            (body.winner !== 'player1' && body.winner !== 'player2')
        ) {
            return c.json(
                {
                    error: "player1Nickname, player2Nickname, and winner('player1' | 'player2') are required",
                },
                400,
            );
        }

        if (p1.length > 20 || p2.length > 20) {
            return c.json({ error: 'Nickname must be 1-20 chars' }, 400);
        }

        if (p1 === p2) {
            return c.json(
                { error: 'player1Nickname and player2Nickname must differ' },
                400,
            );
        }

        try {
            const result = await createMockScore({
                player1Nickname: p1,
                player2Nickname: p2,
                winner: body.winner,
                player1Score: body.player1Score,
                player2Score: body.player2Score,
            });

            return c.json({ ok: true, created: result }, 201);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to insert mock score';
            return c.json({ error: message }, 500);
        }
    });

export { app as analysisRoutes };
