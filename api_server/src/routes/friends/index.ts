import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { friendService } from "../../service/friendService";
import type { AuthEnv } from "../../middleware/auth";

// All routes are mounted behind authMiddleware in routes/index.ts.
// Errors bubble up to the global onError handler in index.ts.
export const friendsRoute = new Hono<AuthEnv>();

// --- Schemas ---
const sendRequestSchema = z
  .object({
    receiver_id: z.string().optional(),
    receiverId: z.string().optional(),
  })
  .refine((data) => data.receiver_id || data.receiverId, {
    message: "receiver_id is required",
  })
  .transform((data) => ({ receiverId: (data.receiver_id ?? data.receiverId) as string }));

// --- Routes ---

// GET /friends
friendsRoute.get("/", async (c) => {
  const userId = c.get("userId");
  const friends = await friendService.getFriendList(userId);
  return c.json(friends, 200);
});

// GET /friends/requests
friendsRoute.get("/requests", async (c) => {
  const userId = c.get("userId");
  const requests = await friendService.getPendingRequests(userId);
  return c.json(requests, 200);
});

// POST /friends/requests
friendsRoute.post("/requests", zValidator("json", sendRequestSchema), async (c) => {
  const userId = c.get("userId");
  const { receiverId } = c.req.valid("json");
  const result = await friendService.sendFriendRequest(userId, receiverId);
  return c.json(result, 201);
});

// POST /friends/requests/:id/accept
friendsRoute.post("/requests/:id/accept", async (c) => {
  const userId = c.get("userId");
  const requestId = c.req.param("id");
  const result = await friendService.acceptFriendRequest(userId, requestId);
  return c.json(result, 200);
});

// POST /friends/requests/:id/reject
friendsRoute.post("/requests/:id/reject", async (c) => {
  const userId = c.get("userId");
  const requestId = c.req.param("id");
  const result = await friendService.rejectFriendRequest(userId, requestId);
  return c.json(result, 200);
});

// POST /friends/:id/remove
friendsRoute.post("/:id/remove", async (c) => {
  const userId = c.get("userId");
  const friendId = c.req.param("id");
  const result = await friendService.removeFriend(userId, friendId);
  return c.json(result, 200);
});