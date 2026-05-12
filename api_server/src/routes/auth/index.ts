import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema } from "./schemas";
import { authService } from "../../service/authService";
import { ApiError } from "../../utils/apiError";

export const authRoutes = new Hono();

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
  try {
    const { email, nickname, password } = c.req.valid("json");
    const { access_token, user } = await authService.register(email, nickname, password);
    return c.json({ access_token, user: toPublicUser(user) }, 201);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

authRoutes.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const { access_token, user } = await authService.login(email, password);
    return c.json({ access_token, user: toPublicUser(user) }, 200);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// JWT is stateless — client discards the token. Endpoint exists as clean API contract.
authRoutes.post("/logout", (c) => c.json({ message: "Logged out successfully" }, 200));
