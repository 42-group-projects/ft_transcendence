import { Hono } from 'hono';
import { friendService } from '../../service/friendService';

export const friendsRoute = new Hono();

friendsRoute.post('/requests', async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    
    if (!body) {
      return c.json({ error: "Invalid JSON format" }, 400);
    }

    const { senderId, receiverId } = body; 

    if (!senderId || typeof senderId !== 'string') {
      return c.json({ error: "senderId is required and must be a string" }, 400);
    }
    if (!receiverId || typeof receiverId !== 'string') {
      return c.json({ error: "receiverId is required and must be a string" }, 400);
    }

    const result = await friendService.sendFriendRequest(senderId, receiverId);
    return c.json(result, 201);
    
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

friendsRoute.get('/requests', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: "userId is required" }, 400);

    const requests = await friendService.getPendingRequests(userId);
    return c.json(requests, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

friendsRoute.post('/requests/:id/accept', async (c) => {
  try {
    const requestId = c.req.param('id');
    const result = await friendService.acceptFriendRequest(requestId);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

friendsRoute.post('/requests/:id/reject', async (c) => {
  try {
    const requestId = c.req.param('id');
    const result = await friendService.rejectFriendRequest(requestId);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

friendsRoute.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: "userId is required" }, 400);

    const friends = await friendService.getFriendList(userId);
    return c.json(friends, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

friendsRoute.post('/:id/remove', async (c) => {
  try {
    const friendId = c.req.param('id');
    const body = await c.req.json();
    const { userId } = body; 
    
    const result = await friendService.removeFriend(userId, friendId);
    return c.json(result, 200);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});
