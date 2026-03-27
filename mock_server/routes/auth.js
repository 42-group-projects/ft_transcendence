import { Hono } from "hono";
import jwt from "jsonwebtoken";
import { store } from "../mock/store.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config.js";

export const authRoutes = new Hono();

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// POST /auth/signup
authRoutes.post("/signup", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body?.email || !body?.nickname || !body?.password) {
    return c.json({ error: "email, nickname, and password are required" }, 400);
  }

  const { email, nickname, password } = body;

  if (password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  if (store.emailTaken(email)) {
    return c.json({ error: "Email already in use" }, 409);
  }

  if (store.nicknameTaken(nickname)) {
    return c.json({ error: "Nickname already taken" }, 409);
  }

  const user = await store.createUser({ email, nickname, password });
  const access_token = signToken(user.id);

  return c.json({ access_token, user }, 201);
});

// POST /auth/login
authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return c.json({ error: "email and password are required" }, 400);
  }

  const user = store.findByEmail(body.email);

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const valid = await store.verifyPassword(user, body.password);

  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const access_token = signToken(user.id);
  return c.json({ access_token, user: store.getPublicUser(user) });
});
