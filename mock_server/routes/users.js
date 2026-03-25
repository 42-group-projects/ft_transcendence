import { Hono } from "hono";
import { store } from "../mock/store.js";

export const userRoutes = new Hono();

// GET /users/me  — requires auth middleware applied at the app level
userRoutes.get("/me", (c) => {
  // c.get("userId") is set by the auth middleware in index.js
  const userId = c.get("userId");
  const user = store.findById(userId);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user: store.getPublicUser(user) });
});

// GET /users/me/stats
userRoutes.get("/me/stats", (c) => {
  const userId = c.get("userId");
  const stats = store.getStats(userId);

  if (!stats) {
    return c.json({ error: "Stats not found" }, 404);
  }

  return c.json({ stats: { user_id: userId, ...stats } });
});
