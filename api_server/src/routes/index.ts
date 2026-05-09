import { Hono } from "hono";
import { friendsRoute } from "./friends/index";
import { analysisRoutes } from "./analysis/index";
import { adminRoutes } from "./admin/index";
import { rankingsRoutes } from "./rankings/index";
import { mockRoutes } from "./mock/index";
import { usersRoutes } from "./users/index";

const app = new Hono()
    .basePath("/api")
    .route("/mock", mockRoutes)
    .route("/analysis", analysisRoutes)
    .route("/admin", adminRoutes)
    .route("/rankings", rankingsRoutes)
    .route("/users", usersRoutes)
    .route("/friends", friendsRoute)
    .get("/", (c) => {
        return c.text("This is the API root.");
    })
    .get("/health", (c) => {
        return c.text("API is healthy!");
    });

export { app as apiRoutes };
