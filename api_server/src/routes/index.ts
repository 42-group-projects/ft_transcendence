import { Hono } from "hono";
import { type JwtUser, authMiddleware } from ../middleware/auth;
import { analysisRoutes } from "./analysis";
import { mockRoutes } from "./mock";

const app = new Hono<{ Variables: { user: JwtUser } }>()
    .use(authMiddleware)
    .basePath("/api")
    .route("/mock", mockRoutes)
    .route("/analysis", analysisRoutes)

    .get("/", (c) => {
        return c.text("This is the API root.");
    });

    .get("/health", (c) => {
        return c.text("API is healthy!");
    });

export { app as apiRoutes };
