import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { userService } from "../../service/userService";
import type { AuthEnv } from "../../middleware/auth";

export const usersRoutes = new Hono<AuthEnv>();

function toPublicUser(user: Record<string, any>) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatar_url: user.avatarUrl ?? null,
    created_at: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updated_at: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

// All routes require authMiddleware applied at the router level in routes/index.ts.
// c.get("userId") is the verified caller's UUID from the JWT.

type MatchRow = Awaited<ReturnType<typeof userService.getMatchHistory>>[number];

function serializeMatches(matches: MatchRow[]) {
  return matches.map((m) => ({
    id: m.id,
    session_id: m.sessionId,
    player1_id: m.player1Id,
    player1_nickname: m.player1Nickname,
    player2_id: m.player2Id ?? null,
    player2_nickname: m.player2Nickname ?? null,
    winner_id: m.winnerId,
    is_cpu_game: m.isCpuGame,
    played_at: m.playedAt instanceof Date ? m.playedAt.toISOString() : m.playedAt,
  }));
}

const updateMeSchema = z.object({
  nickname: z.string().min(1).max(20).optional(),
  avatar_url: z.string().optional(),
}).refine((d) => d.nickname !== undefined || d.avatar_url !== undefined, {
  message: "UNPROCESSABLE",
});

// GET /users/me
usersRoutes.get("/me", async (c) => {
  const userId = c.get("userId") as string;
  const user = await userService.getById(userId);
  return c.json({ user: toPublicUser(user) });
});

// PATCH /users/me
usersRoutes.patch("/me", zValidator("json", updateMeSchema), async (c) => {
  const userId = c.get("userId") as string;
  const updated = await userService.updateMe(userId, c.req.valid("json"));
  return c.json({ user: toPublicUser(updated) });
});

// GET /users/me/matches?limit=20
usersRoutes.get("/me/matches", async (c) => {
  const userId = c.get("userId") as string;
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);
  const matches = await userService.getMatchHistory(userId, limit);
  return c.json({ matches: serializeMatches(matches) });
});

// GET /users/me/stats
usersRoutes.get("/me/stats", async (c) => {
  const userId = c.get("userId") as string;
  const stats = await userService.getStats(userId);
  return c.json({ stats });
});

// GET /users/ranking?limit=50 — leaderboard sorted by rating
usersRoutes.get("/ranking", async (c) => {
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const rows = await userService.getRanking(limit);
  return c.json({
    ranking: rows.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      nickname: r.nickname,
      avatar_url: r.avatarUrl ?? null,
      wins: Number(r.wins),
      losses: Number(r.losses),
      rating: Number(r.rating),
    })),
  });
});

// GET /users/:id  — public profile, no email exposed
usersRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const user = await userService.getById(id);
  return c.json({
    id: user.id,
    nickname: user.nickname,
    avatar_url: user.avatarUrl ?? null,
    created_at: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
  });
});

// GET /users/:id/stats
usersRoutes.get("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const stats = await userService.getStats(id);
  return c.json({ data: stats });
});

// GET /users/:id/matches?limit=20  — match history for a user
usersRoutes.get("/:id/matches", async (c) => {
  const id = c.req.param("id");
  const limit = Math.min(Number(c.req.query("limit") ?? 20), 100);
  const matches = await userService.getMatchHistory(id, limit);
  return c.json({ matches: serializeMatches(matches) });
});

