import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import jwt from "jsonwebtoken";
import { PORT, JWT_SECRET } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";

const app = new Hono();

// ── Global middleware ──────────────────────────────────────────────────────
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*", // tighten this when you have real origins
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// ── Public routes ──────────────────────────────────────────────────────────
app.get("/health", (c) => c.json({ status: "ok", server: "mock-server" }));
app.route("/auth", authRoutes);

// ── JWT auth middleware (all routes below this line are protected) ──────────
app.use("/users/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Missing or malformed Authorization header" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    c.set("userId", payload.sub);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

// ── Protected routes ───────────────────────────────────────────────────────
app.route("/users", userRoutes);

// ── Start ──────────────────────────────────────────────────────────────────
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`API server running on :${PORT}`);
});
