import { Hono } from "hono";
import { friendService } from "../../service/friendService";
import { ApiError } from "../../utils/apiError";
import type { AuthEnv } from "../../middleware/auth";

// All routes in this file are mounted behind authMiddleware in routes/index.ts.
// The caller's userId is always derived from the verified JWT — never from request params.
export const friendsRoute = new Hono<AuthEnv>();

// GET /friends
friendsRoute.get("/", async (c) => {
  try {
    const userId = c.get("userId") as string;
    const friends = await friendService.getFriendList(userId);
    return c.json(friends, 200);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// GET /friends/requests
friendsRoute.get("/requests", async (c) => {
  try {
    const userId = c.get("userId") as string;
    const requests = await friendService.getPendingRequests(userId);
    return c.json(requests, 200);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// POST /friends/requests
// Body: { receiver_id: string }  (also accepts legacy camelCase receiverId)
friendsRoute.post("/requests", async (c) => {
  try {
    const senderId = c.get("userId") as string;
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ error: "UNPROCESSABLE" }, 422);

    const receiverId: unknown = body.receiver_id ?? body.receiverId;
    if (!receiverId || typeof receiverId !== "string") {
      return c.json({ error: "receiver_id is required and must be a string" }, 422);
    }

    const result = await friendService.sendFriendRequest(senderId, receiverId);
    return c.json(result, 201);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    console.error("[POST /friends/requests] Unexpected error:", error);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// POST /friends/requests/:id/accept
friendsRoute.post("/requests/:id/accept", async (c) => {
  try {
    const userId = c.get("userId") as string;
    const requestId = c.req.param("id");
    const result = await friendService.acceptFriendRequest(userId, requestId);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// POST /friends/requests/:id/reject
friendsRoute.post("/requests/:id/reject", async (c) => {
  try {
    const userId = c.get("userId") as string;
    const requestId = c.req.param("id");
    const result = await friendService.rejectFriendRequest(userId, requestId);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});

// POST /friends/:id/remove
friendsRoute.post("/:id/remove", async (c) => {
  try {
    const userId = c.get("userId") as string;
    const friendId = c.req.param("id");
    const result = await friendService.removeFriend(userId, friendId);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ApiError) return c.json({ error: error.message }, error.statusCode as any);
    return c.json({ error: "INTERNAL_ERROR" }, 500);
  }
});