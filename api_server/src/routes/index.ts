import { Hono } from "hono";
import { friendsRoute } from "./friends/index";
import { analysisRoutes } from "./analysis/index";
import { adminRoutes } from "./admin/index";
import { mockRoutes } from "./mock/index";

const app = new Hono()
    .basePath("/api")
    .route("/mock", mockRoutes)
    .route("/analysis", analysisRoutes)
    .route("/admin", adminRoutes)
    .route("/friends", friendsRoute)
    .get("/", (c) => {
        return c.text("This is the API root.");
    })
    .get("/health", (c) => {
        return c.text("API is healthy!");
    });

export { app as apiRoutes };
