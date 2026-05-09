import { Hono } from "hono";
import { createDbClient } from "../../repository/dbClient";
import { userRepository } from "../../repository/userRepository";
import { ApiError } from "../../utils/apiError";
import type { AuthEnv } from "../../middleware/auth";

export const usersRoutes = new Hono<AuthEnv>();

// Converts a DB user row to the public snake_case shape the frontend expects.
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

// All routes here require the authMiddleware applied at the router level in routes/index.ts.
// c.get("userId") is the verified caller's UUID from the JWT.

// GET /users/me
usersRoutes.get("/me", async (c) => {
  const userId = c.get("userId") as string;
  const { db, close } = createDbClient();
  try {
    const user = await userRepository.findById(db, userId);
    if (!user) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({ user: toPublicUser(user) });
  } catch {
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  } finally {
    await close();
  }
});

// PATCH /users/me
usersRoutes.patch("/me", async (c) => {
  const userId = c.get("userId") as string;
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: "UNPROCESSABLE" }, 422);

    const { nickname, avatar_url } = body;
    const updates: { nickname?: string; avatarUrl?: string } = {};

    if (nickname !== undefined) {
      if (typeof nickname !== "string" || nickname.length < 1 || nickname.length > 20) {
        return c.json({ error: "UNPROCESSABLE" }, 422);
      }
      updates.nickname = nickname;
    }
    if (avatar_url !== undefined) {
      if (typeof avatar_url !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
      updates.avatarUrl = avatar_url;
    }
    if (Object.keys(updates).length === 0) return c.json({ error: "UNPROCESSABLE" }, 422);

    const { db, close } = createDbClient();
    try {
      if (updates.nickname) {
        const { db: db2, close: close2 } = createDbClient();
        const exists = await userRepository.nicknameExists(db2, updates.nickname);
        await close2();
        if (exists) return c.json({ error: "AUTH_NICKNAME_EXISTS" }, 409);
      }
      const updated = await userRepository.update(db, userId, updates);
      if (!updated) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json({ user: toPublicUser(updated) });
    } finally {
      await close();
    }
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// GET /users/me/stats
usersRoutes.get("/me/stats", async (c) => {
  const userId = c.get("userId") as string;
  const { db, close } = createDbClient();
  try {
    const stats = await userRepository.getStats(db, userId);
    if (!stats) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({
      stats: {
        user_id: stats.userId,
        wins: stats.wins,
        losses: stats.losses,
        rating: stats.rating,
      },
    });
  } finally {
    await close();
  }
});

// GET /users/:id  — public profile, no email exposed
usersRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { db, close } = createDbClient();
  try {
    const user = await userRepository.findById(db, id);
    if (!user) return c.json({ error: "NOT_FOUND" }, 404);
    return c.json({
      id: user.id,
      nickname: user.nickname,
      avatar_url: user.avatarUrl ?? null,
      created_at: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    });
  } finally {
    await close();
  }
});

// GET /users/:id/stats
usersRoutes.get("/:id/stats", async (c) => {
  const id = c.req.param("id");
  const { db, close } = createDbClient();
  try {
    const stats = await userRepository.getStats(db, id);
    if (!stats) return c.json({ error: "NOT_FOUND" }, 404);

    const wins = stats.wins;
    const losses = stats.losses;
    const total = wins + losses;
    const win_rate = total === 0 ? 0.0 : Math.round((wins / total) * 100) / 100;

    return c.json({
      data: {
        user_id: stats.userId,
        wins,
        losses,
        win_rate,
        rating: stats.rating,
      },
    });
  } finally {
    await close();
  }
});
