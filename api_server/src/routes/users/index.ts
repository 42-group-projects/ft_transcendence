import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userHistoryQuerySchema } from "../../schema/statsSchema";
import { userIdSchema } from "../../schema/userSchema";
import {
  getUserHistoryResponse,
  getUserStatsResponse,
} from "../../service/statsService";

const app = new Hono();

app.get(
  "/:id/stats",
  zValidator("param", userIdSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const result = await getUserStatsResponse(id);
    return c.json(result);
  }
);

app.get(
  "/:id/history",
  zValidator("param", userIdSchema),
  zValidator("query", userHistoryQuerySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { cursor, limit } = c.req.valid("query");
    const result = await getUserHistoryResponse(id, cursor, limit);
    return c.json(result);
  }
);

export { app as usersRoutes };
