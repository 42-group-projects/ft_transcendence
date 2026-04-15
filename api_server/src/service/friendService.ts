import { friendRepository } from '../repository/friendRepository';
import { ApiError } from '../utils/apiError';

export const friendService = {
  sendFriendRequest: async (senderId: string, receiverId: string) => {
    if (senderId === receiverId) {
      throw new ApiError(400, "Cannot send friend request to yourself");
    }
    return await friendRepository.createRequest(senderId, receiverId);
  },

  getPendingRequests: async (userId: string) => {
    return await friendRepository.getPendingRequestsByUserId(userId);
  },

  acceptFriendRequest: async (userId: string, requestId: string) => {
    const request = await friendRepository.getRequestById(requestId);
    
    if (!request) {
      throw new ApiError(404, "Friend request not found");
    }
    if (request.receiverId !== userId) {
      throw new ApiError(403, "You are not authorized to accept this request");
    }
    if (request.status !== 'pending') {
      throw new ApiError(409, "Friend request already processed");
    }
    
    await friendRepository.updateRequestStatus(requestId, 'accepted');
    await friendRepository.createFriendship(request.senderId, request.receiverId);
    
    return { success: true, message: "Friend request accepted" };
  },

  rejectFriendRequest: async (userId: string, requestId: string) => {
    const request = await friendRepository.getRequestById(requestId);
    
    if (!request) {
      throw new ApiError(404, "Friend request not found");
    }
    if (request.receiverId !== userId) {
      throw new ApiError(403, "You are not authorized to reject this request");
    }
    if (request.status !== 'pending') {
      throw new ApiError(409, "Friend request already processed");
    }
    
    await friendRepository.updateRequestStatus(requestId, 'rejected');
    return { success: true, message: "Friend request rejected" };
  },

  getFriendList: async (userId: string) => {
    const friendships = await friendRepository.getFriendsByUserId(userId);
    
    // 相手のIDだけを抽出（ここまでは重複が含まれている可能性がある）
    const rawFriendIds = friendships.map(f => f.userId === userId ? f.friendId : f.userId);
    
    // 重複を削除 
    const uniqueFriendIds = Array.from(new Set(rawFriendIds));
    
    // Socket連携前のモックとしてオフラインを返す
    return uniqueFriendIds.map(id => ({
      userId: id,
      onlineStatus: "offline"
    }));
  },

  removeFriend: async (userId: string, friendId: string) => {
    const result = await friendRepository.removeFriendship(userId, friendId);
    if (result.length === 0) {
      throw new ApiError(404, "Friendship does not exist");
    }
    return { success: true, message: "Friend removed" };
  }
};
