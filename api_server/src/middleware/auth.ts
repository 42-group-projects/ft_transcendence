import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";

export type AuthEnv = { Variables: { userId: string } };

/**
 * JWT auth middleware.
 * Reads `Authorization: Bearer <token>`, verifies it, and stores the caller's
 * userId via `c.set("userId", ...)` so downstream handlers can call
 * `c.get("userId")` without trusting caller-supplied body/query params.
 */
export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not set");
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== "object" || typeof (payload as any).sub !== "string") {
      return c.json({ error: "UNAUTHORIZED" }, 401);
    }
    c.set("userId", (payload as any).sub as string);
    await next();
  } catch {
    return c.json({ error: "UNAUTHORIZED" }, 401);
  }
});
