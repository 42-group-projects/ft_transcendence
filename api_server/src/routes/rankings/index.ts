import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { rankingsQuerySchema } from "../../schema/statsSchema";
import { getRankingsResponse } from "../../service/statsService";
import { errorHandler } from "../../utils/errorHandler";

const app = new Hono();

app.onError(errorHandler);

app.get("/", zValidator("query", rankingsQuerySchema), async (c) => {
  const { cursor, limit } = c.req.valid("query");
  const result = await getRankingsResponse(cursor, limit);

  return c.json(result);
});

export { app as rankingsRoutes };
