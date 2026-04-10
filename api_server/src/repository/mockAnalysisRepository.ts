import { eq, sql } from "drizzle-orm";
import {
  gameRooms,
  gameSessions,
  matchRecords,
  userStats,
  users,
} from "../db/schema";
import type { AppDb } from "./dbClient";

export type UserSummary = {
  id: string;
  nickname: string;
};

export async function findUserByNickname(db: AppDb, nickname: string): Promise<UserSummary | null> {
  const [row] = await db
    .select({ id: users.id, nickname: users.nickname })
    .from(users)
    .where(eq(users.nickname, nickname))
    .limit(1);

  return row ?? null;
}

export async function createUser(db: AppDb, params: {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
}): Promise<UserSummary> {
  const [row] = await db
    .insert(users)
    .values({
      id: params.id,
      email: params.email,
      nickname: params.nickname,
      passwordHash: params.passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: users.id, nickname: users.nickname });

  return row;
}

export async function createGameRoom(db: AppDb, params: {
  id: string;
  hostId: string;
  guestId: string;
}): Promise<void> {
  await db.insert(gameRooms).values({
    id: params.id,
    matchType: "random",
    hostId: params.hostId,
    guestId: params.guestId,
    status: "finished",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function createGameSession(db: AppDb, params: {
  id: string;
  roomId: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
}): Promise<void> {
  const now = new Date();
  await db.insert(gameSessions).values({
    id: params.id,
    roomId: params.roomId,
    player1Id: params.player1Id,
    player2Id: params.player2Id,
    isCpuGame: false,
    winnerId: params.winnerId,
    status: "finished",
    startedAt: now,
    finishedAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

export async function createMatchRecord(db: AppDb, params: {
  id: string;
  sessionId: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
}): Promise<void> {
  const now = new Date();
  await db.insert(matchRecords).values({
    id: params.id,
    sessionId: params.sessionId,
    player1Id: params.player1Id,
    player2Id: params.player2Id,
    winnerId: params.winnerId,
    isCpuGame: false,
    playedAt: now,
    createdAt: now,
  });
}

export async function upsertWinnerStats(db: AppDb, userId: string): Promise<void> {
  await db
    .insert(userStats)
    .values({
      userId,
      wins: 1,
      losses: 0,
      rating: 1016,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        wins: sql`${userStats.wins} + 1`,
        rating: sql`${userStats.rating} + 16`,
        updatedAt: new Date(),
      },
    });
}

export async function upsertLoserStats(db: AppDb, userId: string): Promise<void> {
  await db
    .insert(userStats)
    .values({
      userId,
      wins: 0,
      losses: 1,
      rating: 984,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        losses: sql`${userStats.losses} + 1`,
        rating: sql`greatest(0, ${userStats.rating} - 16)`,
        updatedAt: new Date(),
      },
    });
}
