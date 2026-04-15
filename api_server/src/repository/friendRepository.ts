import { eq, or, and } from 'drizzle-orm';
import { friendRequests, friendships, users } from '../db/schema';
import type { AppDb } from './dbClient';

export const friendRepository = {
  createRequest: async (db: AppDb, senderId: string, receiverId: string) => {
    const result = await db.insert(friendRequests).values({
      senderId,
      receiverId,
      status: 'pending'
    }).returning();
    return result[0];
  },

  getPendingRequestBetweenUsers: async (db: AppDb, user1Id: string, user2Id: string) => {
    const result = await db.select().from(friendRequests).where(
      and(
        eq(friendRequests.status, 'pending'),
        or(
          and(eq(friendRequests.senderId, user1Id), eq(friendRequests.receiverId, user2Id)),
          and(eq(friendRequests.senderId, user2Id), eq(friendRequests.receiverId, user1Id))
        )
      )
    );
    return result[0];
  },

  getFriendshipBetweenUsers: async (db: AppDb, user1Id: string, user2Id: string) => {
    const result = await db.select().from(friendships).where(
      and(
        eq(friendships.status, 'accepted'),
        or(
          and(eq(friendships.userId, user1Id), eq(friendships.friendId, user2Id)),
          and(eq(friendships.userId, user2Id), eq(friendships.friendId, user1Id))
        )
      )
    );
    return result[0];
  },

  getPendingRequestsByUserId: async (db: AppDb, userId: string) => {
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

  updateRequestStatus: async (db: AppDb, requestId: string, status: 'accepted' | 'rejected') => {
    const result = await db.update(friendRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(friendRequests.id, requestId))
      .returning();
    return result[0];
  },

  getRequestById: async (db: AppDb, requestId: string) => {
    const result = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId));
    return result[0];
  },

  createFriendship: async (db: AppDb, userId: string, friendId: string) => {
    const result = await db.insert(friendships).values([
      { userId: userId, friendId: friendId, status: 'accepted' },
      { userId: friendId, friendId: userId, status: 'accepted' }
    ]).returning();
    
    return result;
  },

  getFriendsByUserId: async (db: AppDb, userId: string) => {
    return await db.select()
      .from(friendships)
      .where(
        and(
          or(eq(friendships.userId, userId), eq(friendships.friendId, userId)),
          eq(friendships.status, 'accepted')
        )
      );
  },

  removeFriendship: async (db: AppDb, userId: string, friendId: string) => {
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
