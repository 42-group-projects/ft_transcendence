import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userIdSchema } from "../../schema/userSchema";
import {
  BadRequestError,
  NotFoundError,
  getUserHistoryResponse,
  getUserStatsResponse,
} from "../../service/statsService";

const app = new Hono()
  .get(
    "/:id/stats",
    zValidator("param", userIdSchema),
    async (c) => {
      const { id } = c.req.valid("param");

      try {
        const result = await getUserStatsResponse(id);
        return c.json(result);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return c.json({ error: error.message }, 404);
        }

        const message =
          error instanceof Error ? error.message : "Failed to fetch user stats";
        return c.json({ error: message }, 500);
      }
    }
  )
  .get(
    "/:id/history",
    zValidator("param", userIdSchema), // Zodバリデーションを適用
    async (c) => {
      const { id } = c.req.valid("param");

      try {
        const cursor = c.req.query("cursor");
        const limit = c.req.query("limit");
        const result = await getUserHistoryResponse(id, cursor, limit);

        return c.json(result);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return c.json({ error: error.message }, 404);
        }

        if (error instanceof BadRequestError) {
          return c.json({ error: error.message }, 400);
        }

        const message =
          error instanceof Error ? error.message : "Failed to fetch user history";
        return c.json({ error: message }, 500);
      }
    }
  );

export { app as usersRoutes };
