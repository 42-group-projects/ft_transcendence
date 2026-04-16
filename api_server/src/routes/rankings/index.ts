import { Hono } from "hono";
import { BadRequestError, getRankingsResponse } from "../../service/statsService";

const app = new Hono().get("/", async (c) => {
  try {
    const cursor = c.req.query("cursor");
    const limit = c.req.query("limit");
    const result = await getRankingsResponse(cursor, limit);

    return c.json(result);
  } catch (error) {
    if (error instanceof BadRequestError) {
      return c.json({ error: error.message }, 400);
    }

    const message = error instanceof Error ? error.message : "Failed to fetch rankings";
    return c.json({ error: message }, 500);
  }
});

export { app as rankingsRoutes };
