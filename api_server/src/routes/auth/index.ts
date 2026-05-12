import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema } from "./schemas";
import { authService } from "../../service/authService";
import type { AppEnv } from "../../middleware/db";

export const authRoutes = new Hono<AppEnv>();

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

// --- Routes ---
authRoutes.post("/register", zValidator("json", registerSchema), async (c) => {
  const db = c.get("db");
  const { email, nickname, password } = c.req.valid("json");
  const { access_token, user } = await authService.register(db, email, nickname, password);
  return c.json({ access_token, user: toPublicUser(user) }, 201);
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  const db = c.get("db");
  const { email, password } = c.req.valid("json");
  const { access_token, user } = await authService.login(db, email, password);
  return c.json({ access_token, user: toPublicUser(user) }, 200);
});

// JWT is stateless — client discards the token. Endpoint exists as clean API contract.
authRoutes.post("/logout", (c) => c.json({ message: "Logged out successfully" }, 200));
