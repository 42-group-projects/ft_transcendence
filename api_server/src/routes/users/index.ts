import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { userIdSchema } from "../../schema/userSchema";
import {
  getUserHistoryResponse,
  getUserStatsResponse,
} from "../../service/statsService";
import { errorHandler } from "../../utils/errorHandler";

const app = new Hono();

app.onError(errorHandler);

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
  async (c) => {
    const { id } = c.req.valid("param");
    const cursor = c.req.query("cursor");
    const limit = c.req.query("limit");
    const result = await getUserHistoryResponse(id, cursor, limit);
    return c.json(result);
  }
);

export { app as usersRoutes };
