import { Hono } from "hono";

const app = new Hono().get("/", (c) => {
	return c.json({ message: "analysis routes ready" });
});

export { app as analysisRoutes };
