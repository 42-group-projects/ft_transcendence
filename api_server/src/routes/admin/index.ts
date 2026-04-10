import { Hono } from "hono";
import { getDbInspectSnapshot } from "../../service/adminService";

const MAX_PREVIEW_ROWS = 100;

const app = new Hono().get("/db", async (c) => {
  try {
    const snapshot = await getDbInspectSnapshot(MAX_PREVIEW_ROWS);
    return c.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to inspect database";
    return c.json({ error: message }, 500);
  }
});

export { app as adminRoutes };
