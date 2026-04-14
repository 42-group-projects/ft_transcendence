import { eq, or, and } from 'drizzle-orm';
import { createDbClient } from './dbClient';
import { friendRequests, friendships, users } from '../db/schema';

const { db } = createDbClient();

export const friendRepository = {
  createRequest: async (senderId: string, receiverId: string) => {
    const result = await db.insert(friendRequests).values({
      senderId,
      receiverId,
      status: 'pending'
    }).returning();
    return result[0];
  },

  getPendingRequestsByUserId: async (userId: string) => {
    return await db.select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      createdAt: friendRequests.createdAt,
      senderNickname: users.nickname,
      senderAvatar: users.avatarUrl
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.senderId, users.id))
    .where(and(eq(friendRequests.receiverId, userId), eq(friendRequests.status, 'pending')));
  },

  updateRequestStatus: async (requestId: string, status: 'accepted' | 'rejected') => {
    const result = await db.update(friendRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendRequests.id, requestId))
      .returning();
    return result[0];
  },

  getRequestById: async (requestId: string) => {
    const result = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId));
    return result[0];
  },

  createFriendship: async (userId: string, friendId: string) => {
    const result = await db.insert(friendships).values({
      userId,
      friendId,
      status: 'accepted'
    }).returning();
    return result[0];
  },

  getFriendsByUserId: async (userId: string) => {
    return await db.select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.userId, userId), eq(friendships.friendId, userId)),
          eq(friendships.status, 'accepted')
        )
      );
  },

  removeFriendship: async (userId: string, friendId: string) => {
    const result = await db.update(friendships)
      .set({ status: 'removed', updatedAt: new Date() })
      .where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      )
      .returning();
    return result;
  }
};
