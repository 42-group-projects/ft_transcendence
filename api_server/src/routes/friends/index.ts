import { Hono } from 'hono';
import { friendService } from '../../service/friendService';
import { ApiError } from '../../utils/apiError';

export const friendsRoute = new Hono();

friendsRoute.post('/requests', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    throw new ApiError(422, "Invalid JSON format");
  }

  const { senderId, receiverId } = body;

  if (!senderId || typeof senderId !== 'string') {
    throw new ApiError(422, "senderId is required and must be a string");
  }
  if (!receiverId || typeof receiverId !== 'string') {
    throw new ApiError(422, "receiverId is required and must be a string");
  }

  const result = await friendService.sendFriendRequest(senderId, receiverId);
  return c.json(result, 201);
});

friendsRoute.get('/requests', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) throw new ApiError(422, "userId is required");

  const requests = await friendService.getPendingRequests(userId);
  return c.json(requests, 200);
});

friendsRoute.post('/requests/:id/accept', async (c) => {
  const requestId = c.req.param('id');

  const body = await c.req.json().catch(() => null);
  if (!body || !body.userId || typeof body.userId !== 'string') {
    throw new ApiError(422, "userId is required in body and must be a string");
  }

  const result = await friendService.acceptFriendRequest(body.userId, requestId);
  return c.json(result, 200);
});

friendsRoute.post('/requests/:id/reject', async (c) => {
  const requestId = c.req.param('id');

  const body = await c.req.json().catch(() => null);
  if (!body || !body.userId || typeof body.userId !== 'string') {
    throw new ApiError(422, "userId is required in body and must be a string");
  }

  const result = await friendService.rejectFriendRequest(body.userId, requestId);
  return c.json(result, 200);
});

friendsRoute.get('/', async (c) => {
  const userId = c.req.query('userId');
  if (!userId) throw new ApiError(422, "userId is required");

  const friends = await friendService.getFriendList(userId);
  return c.json(friends, 200);
});

friendsRoute.post('/:id/remove', async (c) => {
  const friendId = c.req.param('id');

  const body = await c.req.json().catch(() => null);
  if (!body) {
    throw new ApiError(422, "Invalid JSON format");
  }

  const { userId } = body;

  if (!userId || typeof userId !== 'string') {
    throw new ApiError(422, "userId is required and must be a string");
  }

  const result = await friendService.removeFriend(userId, friendId);
  return c.json(result, 200);
});
