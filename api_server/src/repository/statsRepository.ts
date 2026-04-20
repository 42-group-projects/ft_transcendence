import { sql } from "drizzle-orm";
import type { AppDb } from "./dbClient";
import {
  encodeHistoryCursor,
  encodeRankingCursor,
  type HistoryCursor,
  type RankingCursor,
} from "../lib/statsCursor";

export type RankingRow = {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  wins: number;
  losses: number;
  rating: number;
  rank: number;
};

export type UserStatsRow = {
  userId: string;
  wins: number;
  losses: number;
  rating: number;
  rank: number;
};

export type MatchHistoryRow = {
  matchId: string;
  opponentUserId: string | null;
  opponentNickname: string;
  opponentAvatarUrl: string | null;
  result: "win" | "loss";
  isCpuGame: boolean;
  playedAt: string;
};

const RANKED_USERS_CTE = sql`
  with ranked_users as (
    select
      u.id as "userId",
      u.nickname as "nickname",
      u.avatar_url as "avatarUrl",
      coalesce(s.wins, 0)::int as "wins",
      coalesce(s.losses, 0)::int as "losses",
      coalesce(s.rating, 1000)::int as "rating",
      row_number() over (
        order by coalesce(s.rating, 1000) desc, u.id asc
      )::int as "rank"
    from users u
    left join user_stats s on s.user_id = u.id
  )
`;

function buildRankingsCursorFilter(cursor: RankingCursor | null) {
  if (!cursor) {
    return sql``;
  }

  return sql`
    where (
      "rating" < ${cursor.rating}
      or ("rating" = ${cursor.rating} and "userId" > ${cursor.userId})
    )
  `;
}

function buildHistoryCursorFilter(cursor: HistoryCursor | null) {
  if (!cursor) {
    return sql``;
  }

  return sql`
    and (
      mr.played_at < ${cursor.playedAt}::timestamptz
      or (mr.played_at = ${cursor.playedAt}::timestamptz and mr.id < ${cursor.matchId})
    )
  `;
}

export async function getRankingsPage(
  db: AppDb,
  params: { cursor: RankingCursor | null; limit: number }
): Promise<RankingRow[]> {
  const rows = await db.execute<RankingRow>(sql`
    ${RANKED_USERS_CTE}
    select *
    from ranked_users
    ${buildRankingsCursorFilter(params.cursor)}
    order by "rating" desc, "userId" asc
    limit ${params.limit + 1}
  `);

  return rows;
}

export async function getUserStatsRow(db: AppDb, userId: string): Promise<UserStatsRow | null> {
  const rows = await db.execute<UserStatsRow>(sql`
    ${RANKED_USERS_CTE}
    select *
    from ranked_users
    where "userId" = ${userId}
    limit 1
  `);

  return rows[0] ?? null;
}

export async function getUserExists(db: AppDb, userId: string): Promise<boolean> {
  const rows = await db.execute<{ exists: boolean }>(sql`
    select exists(
      select 1
      from users
      where id = ${userId}
    ) as "exists"
  `);

  return rows[0]?.exists ?? false;
}

export async function getUserMatchHistoryPage(
  db: AppDb,
  params: { userId: string; cursor: HistoryCursor | null; limit: number }
): Promise<MatchHistoryRow[]> {
  const rows = await db.execute<MatchHistoryRow>(sql`
    select
      mr.id as "matchId",
      case
        when mr.is_cpu_game then null
        else opp.id
      end as "opponentUserId",
      case
        when mr.is_cpu_game then 'CPU'
        else opp.nickname
      end as "opponentNickname",
      case
        when mr.is_cpu_game then null
        else opp.avatar_url
      end as "opponentAvatarUrl",
      case
        when mr.winner_id = ${params.userId} then 'win'
        else 'loss'
      end as "result",
      mr.is_cpu_game as "isCpuGame",
      mr.played_at::text as "playedAt"
    from match_records mr
    left join users opp
      on opp.id = case
        when mr.player1_id = ${params.userId} then mr.player2_id
        else mr.player1_id
      end
    where (mr.player1_id = ${params.userId} or mr.player2_id = ${params.userId})
    ${buildHistoryCursorFilter(params.cursor)}
    order by mr.played_at desc, mr.id desc
    limit ${params.limit + 1}
  `);

  return rows;
}

export function buildNextRankingCursor(row: RankingRow): string {
  return encodeRankingCursor({
    rating: row.rating,
    userId: row.userId,
  });
}

export function buildNextHistoryCursor(row: MatchHistoryRow): string {
  return encodeHistoryCursor({
    playedAt: row.playedAt,
    matchId: row.matchId,
  });
}
