import { desc, eq, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { gameRooms, gameSessions, matchRecords, userStats, users } from '../db/schema';
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
        const user1 = alias(users, 'user1');
        const user2 = alias(users, 'user2');

        return db
            .select({
                id: matchRecords.id,
                sessionId: matchRecords.sessionId,
                player1Id: matchRecords.player1Id,
                player1Nickname: user1.nickname,
                player2Id: matchRecords.player2Id,
                player2Nickname: user2.nickname,
                winnerId: matchRecords.winnerId,
                isCpuGame: matchRecords.isCpuGame,
                playedAt: matchRecords.playedAt,
            })
            .from(matchRecords)
            .innerJoin(user1, eq(user1.id, matchRecords.player1Id))
            .leftJoin(user2, eq(user2.id, matchRecords.player2Id))
            .where(
                or(
                    eq(matchRecords.player1Id, userId),
                    eq(matchRecords.player2Id, userId),
                ),
            )
            .orderBy(desc(matchRecords.playedAt))
            .limit(limit);
    },

    /**
     * Top-N users ordered by rating descending — used for the leaderboard.
     */
    getRanking: async (db: AppDb, limit = 50) => {
        return db
            .select({
                id: users.id,
                nickname: users.nickname,
                avatarUrl: users.avatarUrl,
                wins: userStats.wins,
                losses: userStats.losses,
                rating: userStats.rating,
            })
            .from(userStats)
            .innerJoin(users, eq(users.id, userStats.userId))
            .orderBy(desc(userStats.rating), desc(userStats.wins))
            .limit(limit);
    },
};
