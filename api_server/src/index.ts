import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { apiRoutes } from "./routes/index";

const app = new Hono()
  .use("/*", cors())
  .get("/health", (c) => {
    return c.text("Hello World!");
  })
  .route("/", apiRoutes);

const port = Number(process.env.PORT ?? 4001);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running on :${port}`);
});
