import {
  createGameRoom,
  createGameSession,
  createMatchRecord,
  createUser,
  findUserByNickname,
  upsertLoserStats,
  upsertWinnerStats,
  type UserSummary,
} from "../repository/mockAnalysisRepository";
import type { AppDb } from "../repository/dbClient";
import { createDbClient } from "../repository/dbClient";

export type CreateMockScoreInput = {
  player1Nickname: string;
  player2Nickname: string;
  winner: "player1" | "player2";
  player1Score?: number;
  player2Score?: number;
};

export type CreateMockScoreResult = {
  roomId: string;
  sessionId: string;
  matchRecordId: string;
  player1: UserSummary;
  player2: UserSummary;
  winnerId: string;
  submittedScore: {
    player1: number | null;
    player2: number | null;
  };
};

function buildMockEmail(nickname: string): string {
  const safe = nickname.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return `${safe}_${Math.random().toString(36).slice(2, 8)}@mock.local`;
}

async function ensureUser(db: AppDb, nickname: string): Promise<UserSummary> {
  const existing = await findUserByNickname(db, nickname);
  if (existing) {
    return existing;
  }

  return createUser(db, {
      id: crypto.randomUUID(),
      email: buildMockEmail(nickname),
      nickname,
      passwordHash: "mock_password_hash",
  });
}

export async function createMockScore(input: CreateMockScoreInput): Promise<CreateMockScoreResult> {
  const dbClient = createDbClient();

  try {
    const player1 = await ensureUser(dbClient.db, input.player1Nickname);
    const player2 = await ensureUser(dbClient.db, input.player2Nickname);

    const winnerId = input.winner === "player1" ? player1.id : player2.id;
    const loserId = winnerId === player1.id ? player2.id : player1.id;

    const roomId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const matchRecordId = crypto.randomUUID();

    await createGameRoom(dbClient.db, {
      id: roomId,
      hostId: player1.id,
      guestId: player2.id,
    });

    await createGameSession(dbClient.db, {
      id: sessionId,
      roomId,
      player1Id: player1.id,
      player2Id: player2.id,
      winnerId,
    });

    await createMatchRecord(dbClient.db, {
      id: matchRecordId,
      sessionId,
      player1Id: player1.id,
      player2Id: player2.id,
      winnerId,
    });

    await upsertWinnerStats(dbClient.db, winnerId);
    await upsertLoserStats(dbClient.db, loserId);

    return {
      roomId,
      sessionId,
      matchRecordId,
      player1,
      player2,
      winnerId,
      submittedScore: {
        player1: input.player1Score ?? null,
        player2: input.player2Score ?? null,
      },
    };
  } finally {
    await dbClient.close();
  }
}
