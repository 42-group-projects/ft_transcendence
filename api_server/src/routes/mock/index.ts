import { Hono } from "hono";
import { analysisRoutes } from "./analysis";

const app = new Hono()
    .basePath("/mock")
    .route("/analysis", analysisRoutes)

    .get("/", (c) => {
        return c.text("This is the mock API root.");
    })

    .get("/health", (c) => {
        return c.text("Mock API is healthy!");
    });

export { app as mockRoutes };
