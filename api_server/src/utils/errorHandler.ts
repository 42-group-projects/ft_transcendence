import { Context } from "hono";
import { ApiError } from "./apiError";

export const errorHandler = (err: unknown, c: Context) => {
  if (err instanceof ApiError) {
    return c.json({ error: err.message }, err.statusCode);
  }
  return c.json({ error: (err as Error).message || "Internal Server Error" }, 500);
};