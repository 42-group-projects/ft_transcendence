import { Hono } from 'hono';
import { friendService } from '../../service/friendService';
import { errorHandler } from '../../utils/errorHandler';

export const friendsRoute = new Hono();

friendsRoute.onError(errorHandler);

friendsRoute.post('/requests', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return c.json({ error: "Invalid JSON format" }, 422);
  }

  const { senderId, receiverId } = body;

  if (!senderId || typeof senderId !== 'string') {
    return c.json({ error: "senderId is required and must be a string" }, 422);
  }
  if (!receiverId || typeof receiverId !== 'string') {
    return c.json({ error: "receiverId is required and must be a string" }, 422);
  }

  const result = await friendService.sendFriendRequest(senderId, receiverId);
  return c.json(result, 201);
});

friendsRoute.get('/requests', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: "userId is required" }, 422);

  const requests = await friendService.getPendingRequests(userId);
  return c.json(requests, 200);
});

friendsRoute.post('/requests/:id/accept', async (c) => {
  const requestId = c.req.param('id');

  const body = await c.req.json().catch(() => null);
  if (!body || !body.userId || typeof body.userId !== 'string') {
    return c.json({ error: "userId is required in body and must be a string" }, 422);
  }

  const result = await friendService.acceptFriendRequest(body.userId, requestId);
  return c.json(result, 200);
});

friendsRoute.post('/requests/:id/reject', async (c) => {
  const requestId = c.req.param('id');

  const body = await c.req.json().catch(() => null);
  if (!body || !body.userId || typeof body.userId !== 'string') {
    return c.json({ error: "userId is required in body and must be a string" }, 422);
  }

  const result = await friendService.rejectFriendRequest(body.userId, requestId);
  return c.json(result, 200);
});

friendsRoute.get('/', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) return c.json({ error: "userId is required" }, 422);

  const friends = await friendService.getFriendList(userId);
  return c.json(friends, 200);
});

friendsRoute.post('/:id/remove', async (c) => {
  const friendId = c.req.param('id');

  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ error: "Invalid JSON format" }, 422);
  }

  const { userId } = body;

  if (!userId || typeof userId !== 'string') {
    return c.json({ error: "userId is required and must be a string" }, 422);
  }

  const result = await friendService.removeFriend(userId, friendId);
  return c.json(result, 200);
});
