import { Hono } from "hono";
import { getDbInspectSnapshot } from "../../service/adminService";
import { ApiError } from "../../utils/apiError";

const MAX_PREVIEW_ROWS = 100;

const app = new Hono().get("/db", async (c) => {
  try {
    const snapshot = await getDbInspectSnapshot(MAX_PREVIEW_ROWS);
    return c.json(snapshot);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Failed to inspect database";
    throw new ApiError(500, message);
  }
});

export { app as adminRoutes };
