import { Hono } from 'hono';
import { friendService } from '../../service/friendService';
import { ApiError } from '../../utils/apiError';

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
    
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    const message = error instanceof Error ? error.message : "Failed to send friend request";
    return c.json({ error: message }, 500);
  }
});

friendsRoute.get('/requests', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: "userId is required" }, 400);

    const requests = await friendService.getPendingRequests(userId);
    return c.json(requests, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    const message = error instanceof Error ? error.message : "Failed to fetch friend requests";
    return c.json({ error: message }, 500);
  }
});

friendsRoute.post('/requests/:id/accept', async (c) => {
  try {
    const requestId = c.req.param('id');
    
    const body = await c.req.json().catch(() => null);
    if (!body || !body.userId || typeof body.userId !== 'string') {
      return c.json({ error: "userId is required in body and must be a string" }, 400);
    }

    const result = await friendService.acceptFriendRequest(body.userId, requestId);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    const message = error instanceof Error ? error.message : "Failed to accept friend request";
    return c.json({ error: message }, 500);
  }
});

friendsRoute.post('/requests/:id/reject', async (c) => {
  try {
    const requestId = c.req.param('id');
    
    const body = await c.req.json().catch(() => null);
    if (!body || !body.userId || typeof body.userId !== 'string') {
      return c.json({ error: "userId is required in body and must be a string" }, 400);
    }

    const result = await friendService.rejectFriendRequest(body.userId, requestId);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    const message = error instanceof Error ? error.message : "Failed to reject friend request";
    return c.json({ error: message }, 500);
  }
});

friendsRoute.get('/', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: "userId is required" }, 400);

    const friends = await friendService.getFriendList(userId);
    return c.json(friends, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    const message = error instanceof Error ? error.message : "Failed to fetch friend list";
    return c.json({ error: message }, 500);
  }
});

friendsRoute.post('/:id/remove', async (c) => {
  try {
    const friendId = c.req.param('id');
    
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json({ error: "Invalid JSON format" }, 400);
    }

    const { userId } = body; 
    
    if (!userId || typeof userId !== 'string') {
      return c.json({ error: "userId is required and must be a string" }, 400);
    }
    
    const result = await friendService.removeFriend(userId, friendId);
    return c.json(result, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      return c.json({ error: error.message }, error.statusCode as any);
    }
    const message = error instanceof Error ? error.message : "Failed to remove friend";
    return c.json({ error: message }, 500);
  }
});
