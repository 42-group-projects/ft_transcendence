import { createDbClient } from "../repository/dbClient";
import {
  buildNextHistoryCursor,
  buildNextRankingCursor,
  decodeHistoryCursor,
  decodeRankingCursor,
  DEFAULT_PAGE_LIMIT,
  getRankingsPage,
  getUserMatchHistoryPage,
  getUserStatsRow,
  MAX_PAGE_LIMIT,
  type MatchHistoryRow,
  type RankingRow,
} from "../repository/statsRepository";

export class BadRequestError extends Error {}
export class NotFoundError extends Error {}

export type RankingsResponseItem = {
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  wins: number;
  losses: number;
  rating: number;
  rank: number;
};

export type RankingsResponse = {
  data: RankingsResponseItem[];
  meta: {
    cursor: string | null;
    has_more: boolean;
  };
};

export type UserStatsResponse = {
  data: {
    user_id: string;
    wins: number;
    losses: number;
    win_rate: number;
    rating: number;
    rank: number;
  };
};

export type UserHistoryResponseItem = {
  match_id: string;
  opponent: {
    user_id: string | null;
    nickname: string;
    avatar_url: string | null;
  };
  result: "win" | "loss";
  is_cpu_game: boolean;
  played_at: string;
};

export type UserHistoryResponse = {
  data: UserHistoryResponseItem[];
  meta: {
    cursor: string | null;
    has_more: boolean;
  };
};

function normalizeLimit(rawLimit: string | null | undefined): number {
  if (rawLimit == null || rawLimit === "") {
    return DEFAULT_PAGE_LIMIT;
  }

  const parsed = Number(rawLimit);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new BadRequestError("limit must be a positive integer");
  }

  return Math.min(parsed, MAX_PAGE_LIMIT);
}

function parseRankingCursor(rawCursor: string | null | undefined) {
  if (!rawCursor) {
    return null;
  }

  try {
    return decodeRankingCursor(rawCursor);
  } catch {
    throw new BadRequestError("Invalid cursor format");
  }
}

function parseHistoryCursor(rawCursor: string | null | undefined) {
  if (!rawCursor) {
    return null;
  }

  try {
    return decodeHistoryCursor(rawCursor);
  } catch {
    throw new BadRequestError("Invalid cursor format");
  }
}

function calculateWinRate(wins: number, losses: number): number {
  const total = wins + losses;
  if (total <= 0) {
    return 0;
  }

  return Math.round((wins / total) * 100) / 100;
}

function mapRankingRow(row: RankingRow): RankingsResponseItem {
  return {
    user_id: row.userId,
    nickname: row.nickname,
    avatar_url: row.avatarUrl,
    wins: row.wins,
    losses: row.losses,
    rating: row.rating,
    rank: row.rank,
  };
}

function mapHistoryRow(row: MatchHistoryRow): UserHistoryResponseItem {
  return {
    match_id: row.matchId,
    opponent: {
      user_id: row.opponentUserId,
      nickname: row.opponentNickname,
      avatar_url: row.opponentAvatarUrl,
    },
    result: row.result,
    is_cpu_game: row.isCpuGame,
    played_at: row.playedAt,
  };
}

export async function getRankingsResponse(rawCursor: string | null | undefined, rawLimit: string | null | undefined): Promise<RankingsResponse> {
  const limit = normalizeLimit(rawLimit);
  const cursor = parseRankingCursor(rawCursor);
  const dbClient = createDbClient();

  try {
    const rows = await getRankingsPage(dbClient.db, { cursor, limit });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map(mapRankingRow);
    const nextCursor = hasMore && items.length > 0 ? buildNextRankingCursor(rows[limit - 1]) : null;

    return {
      data: items,
      meta: {
        cursor: nextCursor,
        has_more: hasMore,
      },
    };
  } finally {
    await dbClient.close();
  }
}

export async function getUserStatsResponse(userId: string): Promise<UserStatsResponse> {
  const dbClient = createDbClient();

  try {
    const row = await getUserStatsRow(dbClient.db, userId);

    if (!row) {
      throw new NotFoundError("User not found");
    }

    return {
      data: {
        user_id: row.userId,
        wins: row.wins,
        losses: row.losses,
        win_rate: calculateWinRate(row.wins, row.losses),
        rating: row.rating,
        rank: row.rank,
      },
    };
  } finally {
    await dbClient.close();
  }
}

export async function getUserHistoryResponse(
  userId: string,
  rawCursor: string | null | undefined,
  rawLimit: string | null | undefined
): Promise<UserHistoryResponse> {
  const limit = normalizeLimit(rawLimit);
  const cursor = parseHistoryCursor(rawCursor);
  const dbClient = createDbClient();

  try {
    const user = await getUserStatsRow(dbClient.db, userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const rows = await getUserMatchHistoryPage(dbClient.db, { userId, cursor, limit });
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map(mapHistoryRow);
    const nextCursor = hasMore && items.length > 0 ? buildNextHistoryCursor(rows[limit - 1]) : null;

    return {
      data: items,
      meta: {
        cursor: nextCursor,
        has_more: hasMore,
      },
    };
  } finally {
    await dbClient.close();
  }
}
