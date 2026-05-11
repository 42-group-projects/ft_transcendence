import { Hono } from "hono";
import { authService } from "../../service/authService";
import { ApiError } from "../../utils/apiError";

export const authRoutes = new Hono();

// Converts a DB user row to the public shape the frontend expects (snake_case).
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

// POST /auth/register
authRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: "UNPROCESSABLE" }, 422);

    const { email, nickname, password } = body;
    if (!email || typeof email !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
    if (!nickname || typeof nickname !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
    if (!password || typeof password !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
    if (password.length < 8) return c.json({ error: "UNPROCESSABLE" }, 422);

    const { access_token, user } = await authService.register(email, nickname, password);
    return c.json({ access_token, user: toPublicUser(user) }, 201);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// POST /auth/login
authRoutes.post("/login", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: "UNPROCESSABLE" }, 422);

    const { email, password } = body;
    if (!email || typeof email !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
    if (!password || typeof password !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);

    const { access_token, user } = await authService.login(email, password);
    return c.json({ access_token, user: toPublicUser(user) }, 200);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// POST /auth/logout
// JWT is stateless so the server has no session to destroy.
// The client is responsible for discarding the token; this endpoint
// exists as a clean API contract and for future blocklist support.
authRoutes.post("/logout", (c) => {
  return c.json({ message: "Logged out successfully" }, 200);
});

// POST /auth/signup — alias so existing frontend calls to /auth/signup keep working
// without a frontend change. Both paths hit the same logic.
authRoutes.post("/signup", async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: "UNPROCESSABLE" }, 422);

    const { email, nickname, password } = body;
    if (!email || typeof email !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
    if (!nickname || typeof nickname !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
    if (!password || typeof password !== "string") return c.json({ error: "UNPROCESSABLE" }, 422);
    if (password.length < 8) return c.json({ error: "UNPROCESSABLE" }, 422);

    const { access_token, user } = await authService.register(email, nickname, password);
    return c.json({ access_token, user: toPublicUser(user) }, 201);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});
