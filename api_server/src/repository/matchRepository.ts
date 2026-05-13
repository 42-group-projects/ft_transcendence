import { eq, sql } from 'drizzle-orm';
import { gameRooms, gameSessions, matchRecords, userStats } from '../db/schema';
import type { AppDb } from './dbClient';

const RATING_WIN_DELTA = 15;
const RATING_LOSS_DELTA = 15;
const PERSISTED_CPU_LEVELS = new Set(['easy', 'medium', 'hard', 'oni']);

export type MatchResultInput = {
    player1Id: string;
    player2Id?: string | null;
    winnerId: string;
    isCpuGame: boolean;
    cpuLevel?: string | null;
    startedAt: Date;
};

export class MatchResultValidationError extends Error {}

function normalizeCpuLevel(input: MatchResultInput) {
    if (!input.isCpuGame) {
        return null;
    }

    if (input.cpuLevel === 'dummy') {
        return 'easy' as const;
    }

    if (input.cpuLevel && PERSISTED_CPU_LEVELS.has(input.cpuLevel)) {
        return input.cpuLevel as 'easy' | 'medium' | 'hard' | 'oni';
    }

    return 'medium' as const;
}

function normalizePlayer2Id(input: MatchResultInput) {
    if (input.isCpuGame) {
        return null;
    }

    if (!input.player2Id) {
        throw new MatchResultValidationError(
            'player2Id is required for PvP matches',
        );
    }

    return input.player2Id;
}

function normalizeWinnerId(input: MatchResultInput, player2Id: string | null) {
    if (input.isCpuGame) {
        if (input.winnerId !== input.player1Id) {
            throw new MatchResultValidationError(
                'CPU winners are not supported by persisted match records',
            );
        }

        return input.player1Id;
    }

    if (input.winnerId !== input.player1Id && input.winnerId !== player2Id) {
        throw new MatchResultValidationError(
            'winnerId must belong to a player',
        );
    }

    return input.winnerId;
}

export const matchRepository = {
    /**
     * Persists a completed match atomically:
     *   gameRooms (synthetic row) → gameSessions → matchRecords → userStats wins/losses
     */
    saveMatchResult: async (
        db: AppDb,
        input: MatchResultInput,
    ): Promise<void> => {
        const player2Id = normalizePlayer2Id(input);
        const winnerId = normalizeWinnerId(input, player2Id);
        const cpuLevel = normalizeCpuLevel(input);

        await db.transaction(async (tx) => {
            // 1. Minimal gameRooms row (the in-memory socket room has no DB counterpart)
            const [room] = await tx
                .insert(gameRooms)
                .values({
                    matchType: input.isCpuGame ? 'cpu' : 'random',
                    hostId: input.player1Id,
                    guestId: player2Id,
                    cpuLevel,
                    status: 'finished',
                })
                .returning({ id: gameRooms.id });

            // 2. gameSessions row
            const [session] = await tx
                .insert(gameSessions)
                .values({
                    roomId: room.id,
                    player1Id: input.player1Id,
                    player2Id,
                    isCpuGame: input.isCpuGame,
                    cpuLevel,
                    winnerId,
                    status: 'finished',
                    startedAt: input.startedAt,
                    finishedAt: new Date(),
                })
                .returning({ id: gameSessions.id });

            // 3. matchRecords row (the permanent history entry)
            await tx.insert(matchRecords).values({
                sessionId: session.id,
                player1Id: input.player1Id,
                player2Id,
                winnerId,
                isCpuGame: input.isCpuGame,
                playedAt: new Date(),
            });

            // 4. Increment wins/losses for player1, update rating (PvP only)
            if (winnerId === input.player1Id) {
                await tx
                    .update(userStats)
                    .set({
                        wins: sql`${userStats.wins} + 1`,
                        ...(input.isCpuGame
                            ? {}
                            : {
                                  rating: sql`${userStats.rating} + ${RATING_WIN_DELTA}`,
                              }),
                        updatedAt: new Date(),
                    })
                    .where(eq(userStats.userId, input.player1Id));
            } else {
                await tx
                    .update(userStats)
                    .set({
                        losses: sql`${userStats.losses} + 1`,
                        ...(input.isCpuGame
                            ? {}
                            : {
                                  rating: sql`GREATEST(0, ${userStats.rating} - ${RATING_LOSS_DELTA})`,
                              }),
                        updatedAt: new Date(),
                    })
                    .where(eq(userStats.userId, input.player1Id));
            }

            // 5. Increment wins/losses for player2 (human only)
            if (player2Id) {
                if (winnerId === player2Id) {
                    await tx
                        .update(userStats)
                        .set({
                            wins: sql`${userStats.wins} + 1`,
                            rating: sql`${userStats.rating} + ${RATING_WIN_DELTA}`,
                            updatedAt: new Date(),
                        })
                        .where(eq(userStats.userId, player2Id));
                } else {
                    await tx
                        .update(userStats)
                        .set({
                            losses: sql`${userStats.losses} + 1`,
                            rating: sql`GREATEST(0, ${userStats.rating} - ${RATING_LOSS_DELTA})`,
                            updatedAt: new Date(),
                        })
                        .where(eq(userStats.userId, player2Id));
                }
            }
        });
    },

    /**
     * Returns the last N match records for a user, enriched with both players'
     * nicknames so the frontend can render "You vs <opponent>" without extra calls.
     */
    getMatchHistory: async (db: AppDb, userId: string, limit = 20) => {
        // Raw SQL join to enrich with both player nicknames in one query.
        const rows = await db.execute(sql`
			SELECT
				mr.id,
				mr.session_id    AS "sessionId",
				mr.player1_id    AS "player1Id",
				u1.nickname      AS "player1Nickname",
				mr.player2_id    AS "player2Id",
				u2.nickname      AS "player2Nickname",
				mr.winner_id     AS "winnerId",
				mr.is_cpu_game   AS "isCpuGame",
				mr.played_at     AS "playedAt"
			FROM match_records mr
			JOIN users u1 ON u1.id = mr.player1_id
			LEFT JOIN users u2 ON u2.id = mr.player2_id
			WHERE mr.player1_id = ${userId}
			   OR mr.player2_id = ${userId}
			ORDER BY mr.played_at DESC
			LIMIT ${limit}
		`);

        return rows as unknown as Array<{
            id: string;
            sessionId: string;
            player1Id: string;
            player1Nickname: string;
            player2Id: string | null;
            player2Nickname: string | null;
            winnerId: string;
            isCpuGame: boolean;
            playedAt: Date;
        }>;
    },

    /**
     * Top-N users ordered by rating descending — used for the leaderboard.
     */
    getRanking: async (db: AppDb, limit = 50) => {
        const rows = await db.execute(sql`
			SELECT
				u.id,
				u.nickname,
				u.avatar_url   AS "avatarUrl",
				s.wins,
				s.losses,
				s.rating
			FROM user_stats s
			JOIN users u ON u.id = s.user_id
			ORDER BY s.rating DESC, s.wins DESC
			LIMIT ${limit}
		`);

        return rows as unknown as Array<{
            id: string;
            nickname: string;
            avatarUrl: string | null;
            wins: number;
            losses: number;
            rating: number;
        }>;
    },
};
