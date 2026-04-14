import { friendRepository } from '../repository/friendRepository';

export const friendService = {
  sendFriendRequest: async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) {
      throw new Error("Cannot send friend request to yourself");
    }
    return await friendRepository.createRequest(senderId, receiverId);
  },

  getPendingRequests: async (userId: string) => {
    return await friendRepository.getPendingRequestsByUserId(userId);
  },

  acceptFriendRequest: async (requestId: string) => {
    const request = await friendRepository.getRequestById(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error("Invalid or already processed request");
    }
    
    await friendRepository.updateRequestStatus(requestId, 'accepted');
    await friendRepository.createFriendship(request.senderId, request.receiverId);
    
    return { success: true, message: "Friend request accepted" };
  },

  rejectFriendRequest: async (requestId: string) => {
    const request = await friendRepository.getRequestById(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error("Invalid or already processed request");
    }
    
    await friendRepository.updateRequestStatus(requestId, 'rejected');
    return { success: true, message: "Friend request rejected" };
  },

  getFriendList: async (userId: string) => {
    const friendships = await friendRepository.getFriendsByUserId(userId);
    
    const friendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);
    
    // Socket連携前のモックとしてオフラインを返す
    return friendIds.map(id => ({
      userId: id,
      onlineStatus: "offline"
    }));
  },

  removeFriend: async (userId: string, friendId: string) => {
    const result = await friendRepository.removeFriendship(userId, friendId);
    if (result.length === 0) {
      throw new Error("Friendship does not exist");
    }
    return { success: true, message: "Friend removed" };
  }
};
