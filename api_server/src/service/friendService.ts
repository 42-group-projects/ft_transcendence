import { friendRepository } from '../repository/friendRepository';
import { ApiError } from '../utils/apiError';
import { createDbClient } from '../repository/dbClient'; /

export const friendService = {
  sendFriendRequest: async (senderId: string, receiverId: string) => {
    const { db, close } = createDbClient(); 
    try {
      if (senderId === receiverId) {
        throw new ApiError(400, "Cannot send friend request to yourself");
      }
      return await friendRepository.createRequest(db, senderId, receiverId);
    } finally {
      await close(); 
    }
  },

  getPendingRequests: async (userId: string) => {
    const { db, close } = createDbClient();
    try {
      return await friendRepository.getPendingRequestsByUserId(db, userId);
    } finally {
      await close();
    }
  },

  acceptFriendRequest: async (userId: string, requestId: string) => {
    const { db, close } = createDbClient();
    try {
      const request = await friendRepository.getRequestById(db, requestId);
      
      if (!request) {
        throw new ApiError(404, "Friend request not found");
      }
      if (request.receiverId !== userId) {
        throw new ApiError(403, "You are not authorized to accept this request");
      }
      if (request.status !== 'pending') {
        throw new ApiError(409, "Friend request already processed");
      }
      
      await friendRepository.updateRequestStatus(db, requestId, 'accepted');
      await friendRepository.createFriendship(db, request.senderId, request.receiverId);
      
      return { success: true, message: "Friend request accepted" };
    } finally {
      await close();
    }
  },

  rejectFriendRequest: async (userId: string, requestId: string) => {
    const { db, close } = createDbClient();
    try {
      const request = await friendRepository.getRequestById(db, requestId);
      
      if (!request) {
        throw new ApiError(404, "Friend request not found");
      }
      if (request.receiverId !== userId) {
        throw new ApiError(403, "You are not authorized to reject this request");
      }
      if (request.status !== 'pending') {
        throw new ApiError(409, "Friend request already processed");
      }
      
      await friendRepository.updateRequestStatus(db, requestId, 'rejected');
      return { success: true, message: "Friend request rejected" };
    } finally {
      await close();
    }
  },

  getFriendList: async (userId: string) => {
    const { db, close } = createDbClient();
    try {
      const friendships = await friendRepository.getFriendsByUserId(db, userId);
      const rawFriendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);
      const uniqueFriendIds = Array.from(new Set(rawFriendIds));
      
      return uniqueFriendIds.map(id => ({
        userId: id,
        onlineStatus: "offline"
      }));
    } finally {
      await close();
    }
  },

  removeFriend: async (userId: string, friendId: string) => {
    const { db, close } = createDbClient();
    try {
      const result = await friendRepository.removeFriendship(db, userId, friendId);
      if (result.length === 0) {
        throw new ApiError(404, "Friendship does not exist");
      }
      return { success: true, message: "Friend removed" };
    } finally {
      await close();
    }
  }
};
