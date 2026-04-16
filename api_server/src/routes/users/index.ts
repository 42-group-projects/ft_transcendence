import { Hono } from "hono";
import {
  BadRequestError,
  NotFoundError,
  getUserHistoryResponse,
  getUserStatsResponse,
} from "../../service/statsService";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

const app = new Hono()
  .get("/:id/stats", async (c) => {
    const userId = c.req.param("id");

    if (!isValidUuid(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }

    try {
      const result = await getUserStatsResponse(userId);
      return c.json(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message }, 404);
      }

      const message = error instanceof Error ? error.message : "Failed to fetch user stats";
      return c.json({ error: message }, 500);
    }
  })
  .get("/:id/history", async (c) => {
    const userId = c.req.param("id");

    if (!isValidUuid(userId)) {
      return c.json({ error: "Invalid user id" }, 400);
    }

    try {
      const cursor = c.req.query("cursor");
      const limit = c.req.query("limit");
      const result = await getUserHistoryResponse(userId, cursor, limit);

      return c.json(result);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return c.json({ error: error.message }, 404);
      }

      if (error instanceof BadRequestError) {
        return c.json({ error: error.message }, 400);
      }

      const message = error instanceof Error ? error.message : "Failed to fetch user history";
      return c.json({ error: message }, 500);
    }
  });

export { app as usersRoutes };
