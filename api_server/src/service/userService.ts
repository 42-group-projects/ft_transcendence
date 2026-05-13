import { createDbClient } from '../repository/dbClient';
import { userRepository } from '../repository/userRepository';
import { ApiError } from '../utils/apiError';

export const userService = {
    async getById(userId: string) {
        const { db, close } = createDbClient();
        try {
            const user = await userRepository.findById(db, userId);
            if (!user) throw new ApiError(404, 'NOT_FOUND');
            return user;
        } finally {
            await close();
        }
    },

    async updateMe(
        userId: string,
        body: { nickname?: string; avatar_url?: string },
    ) {
        const updates: { nickname?: string; avatarUrl?: string } = {};

        if (body.nickname !== undefined) {
            if (
                typeof body.nickname !== 'string' ||
                body.nickname.length < 1 ||
                body.nickname.length > 20
            ) {
                throw new ApiError(422, 'UNPROCESSABLE');
            }
            updates.nickname = body.nickname;
        }

        if (body.avatar_url !== undefined) {
            if (typeof body.avatar_url !== 'string')
                throw new ApiError(422, 'UNPROCESSABLE');
            updates.avatarUrl = body.avatar_url;
        }

        if (Object.keys(updates).length === 0)
            throw new ApiError(422, 'UNPROCESSABLE');

        const { db, close } = createDbClient();
        try {
            if (updates.nickname) {
                const exists = await userRepository.nicknameExists(
                    db,
                    updates.nickname,
                );
                if (exists) throw new ApiError(409, 'AUTH_NICKNAME_EXISTS');
            }
            const updated = await userRepository.update(db, userId, updates);
            if (!updated) throw new ApiError(404, 'NOT_FOUND');
            return updated;
        } finally {
            await close();
        }
    },

    async getStats(userId: string) {
        const { db, close } = createDbClient();
        try {
            const stats = await userRepository.getStats(db, userId);
            if (!stats) throw new ApiError(404, 'NOT_FOUND');
            const total = stats.wins + stats.losses;
            const win_rate =
                total === 0
                    ? 0.0
                    : Math.round((stats.wins / total) * 100) / 100;
            return {
                user_id: stats.userId,
                wins: stats.wins,
                losses: stats.losses,
                win_rate,
                rating: stats.rating,
            };
        } finally {
            await close();
        }
    },
};
