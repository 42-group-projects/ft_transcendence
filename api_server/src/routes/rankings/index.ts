import { Hono } from "hono";
import { getRankingsResponse } from "../../service/statsService";
import { errorHandler } from "../../utils/errorHandler";

const app = new Hono();

app.onError(errorHandler);

app.get("/", async (c) => {
  const cursor = c.req.query("cursor");
  const limit = c.req.query("limit");
  const result = await getRankingsResponse(cursor, limit);

  return c.json(result);
});

export { app as rankingsRoutes };
