export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export type RankingCursor = {
  rating: number;
  userId: string;
};

export type HistoryCursor = {
  playedAt: string;
  matchId: string;
};

function encodeCursor(value: RankingCursor | HistoryCursor): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeCursor<T extends object>(cursor: string): T {
  let parsed: unknown;

  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid cursor format");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid cursor format");
  }

  return parsed as T;
}

export function encodeRankingCursor(cursor: RankingCursor): string {
  return encodeCursor(cursor);
}

export function encodeHistoryCursor(cursor: HistoryCursor): string {
  return encodeCursor(cursor);
}

export function decodeRankingCursor(cursor: string): RankingCursor {
  const parsed = decodeCursor<Partial<RankingCursor>>(cursor);

  if (typeof parsed.rating !== "number" || typeof parsed.userId !== "string") {
    throw new Error("Invalid cursor format");
  }

  return {
    rating: parsed.rating,
    userId: parsed.userId,
  };
}

export function decodeHistoryCursor(cursor: string): HistoryCursor {
  const parsed = decodeCursor<Partial<HistoryCursor>>(cursor);

  if (typeof parsed.playedAt !== "string" || typeof parsed.matchId !== "string") {
    throw new Error("Invalid cursor format");
  }

  return {
    playedAt: parsed.playedAt,
    matchId: parsed.matchId,
  };
}
