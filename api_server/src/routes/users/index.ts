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

// GET /users/me/stats
usersRoutes.get("/me/stats", async (c) => {
  const userId = c.get("userId") as string;
  const stats = await userService.getStats(userId);
  return c.json({ stats });
});

// GET /users/:id — returns a public profile with no email exposed
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


