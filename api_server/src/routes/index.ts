import { Hono } from "hono";
import { friendsRoute } from "./friends/index";
import { analysisRoutes } from "./analysis/index";
import { adminRoutes } from "./admin/index";
import { mockRoutes } from "./mock/index";
import { authRoutes } from "./auth/index";
import { usersRoutes } from "./users/index";
import { authMiddleware } from "../middleware/auth";

const app = new Hono()
    .basePath("/api")
    // Public
    .route("/auth", authRoutes)
    // Protected — JWT required
    .use("/users/*", authMiddleware)
    .route("/users", usersRoutes)
    .use("/friends/*", authMiddleware)
    .use("/friends", authMiddleware)
    .route("/friends", friendsRoute)
    // Internal / tooling
    .use("/analysis/*", authMiddleware)
    .use("/analysis", authMiddleware)
    .route("/mock", mockRoutes)
    .route("/analysis", analysisRoutes)
    .use("/admin/*", authMiddleware)
    .use("/admin", authMiddleware)
    .route("/admin", adminRoutes)
    .get("/", (c) => {
        return c.text("This is the API root.");
    })
    .get("/health", (c) => {
        return c.text("API is healthy!");
    });

export { app as apiRoutes };
