import { friendRepository } from '../repository/friendRepository';
import { userRepository } from '../repository/userRepository';
import { ApiError } from '../utils/apiError';
import { createDbClient } from '../repository/dbClient';

export const friendService = {
    sendFriendRequest: async (
        senderId: string,
        receiverId?: string,
        nickname?: string,
    ) => {
        const { db, close } = createDbClient();
        try {
            let resolvedReceiverId = receiverId;

            if (!resolvedReceiverId && nickname) {
                const user = await userRepository.findByNickname(db, nickname);
                if (!user) {
                    throw new ApiError(404, 'USER_NOT_FOUND');
                }
                resolvedReceiverId = user.id;
            }

            if (!resolvedReceiverId) {
                throw new ApiError(422, 'receiver_id or nickname is required');
            }

            if (senderId === resolvedReceiverId) {
                throw new ApiError(422, 'SOCIAL_SELF_REQUEST');
            }

            const receiverExists = await friendRepository.checkUserExists(
                db,
                resolvedReceiverId,
            );
            if (!receiverExists) {
                throw new ApiError(404, 'NOT_FOUND');
            }

            const existingFriendship =
                await friendRepository.getFriendshipBetweenUsers(
                    db,
                    senderId,
                    resolvedReceiverId,
                );
            if (existingFriendship) {
                throw new ApiError(409, 'SOCIAL_ALREADY_FRIENDS');
            }

            const existingRequest =
                await friendRepository.getPendingRequestBetweenUsers(
                    db,
                    senderId,
                    resolvedReceiverId,
                );
            if (existingRequest) {
                throw new ApiError(409, 'SOCIAL_REQUEST_EXISTS');
            }

            return await friendRepository.createRequest(
                db,
                senderId,
                resolvedReceiverId,
            );
        } finally {
            await close();
        }
    },

    getPendingRequests: async (userId: string) => {
        const { db, close } = createDbClient();
        try {
            return await friendRepository.getPendingRequestsByUserId(
                db,
                userId,
            );
        } finally {
            await close();
        }
    },

    acceptFriendRequest: async (userId: string, requestId: string) => {
        const { db, close } = createDbClient();
        try {
            return await db.transaction(async (tx) => {
                const request = await friendRepository.getRequestById(
                    tx as any,
                    requestId,
                );

                if (!request) {
                    throw new ApiError(404, 'Friend request not found');
                }
                if (request.receiverId !== userId) {
                    throw new ApiError(
                        403,
                        'You are not authorized to accept this request',
                    );
                }
                if (request.status !== 'pending') {
                    throw new ApiError(409, 'Friend request already processed');
                }

                await friendRepository.updateRequestStatus(
                    tx as any,
                    requestId,
                    'accepted',
                );
                await friendRepository.createFriendship(
                    tx as any,
                    request.senderId,
                    request.receiverId,
                );

                return { success: true, message: 'Friend request accepted' };
            });
        } finally {
            await close();
        }
    },

    rejectFriendRequest: async (userId: string, requestId: string) => {
        const { db, close } = createDbClient();
        try {
            const request = await friendRepository.getRequestById(
                db,
                requestId,
            );

            if (!request) {
                throw new ApiError(404, 'Friend request not found');
            }
            if (request.receiverId !== userId) {
                throw new ApiError(
                    403,
                    'You are not authorized to reject this request',
                );
            }
            if (request.status !== 'pending') {
                throw new ApiError(409, 'Friend request already processed');
            }

            await friendRepository.updateRequestStatus(
                db,
                requestId,
                'rejected',
            );
            return { success: true, message: 'Friend request rejected' };
        } finally {
            await close();
        }
    },

    getFriendList: async (userId: string) => {
        const { db, close } = createDbClient();
        try {
            const friends =
                await friendRepository.getFriendsWithProfilesByUserId(
                    db,
                    userId,
                );
            return friends.map((f) => ({
                userId: f.userId,
                nickname: f.nickname,
                avatarUrl: f.avatarUrl ?? '/api/uploads/default-avatar.svg',
                onlineStatus: 'offline',
            }));
        } finally {
            await close();
        }
    },

    removeFriend: async (userId: string, friendId: string) => {
        const { db, close } = createDbClient();
        try {
            const result = await friendRepository.removeFriendship(
                db,
                userId,
                friendId,
            );
            if (result.length === 0) {
                throw new ApiError(404, 'Friendship does not exist');
            }
            return { success: true, message: 'Friend removed' };
        } finally {
            await close();
        }
    },
};
