import { eq } from 'drizzle-orm';
import { users, userStats } from '../db/schema';
import type { AppDb } from './dbClient';

export type NewUser = {
    email: string;
    nickname: string;
    passwordHash: string;
};

export type UpdateUser = {
    nickname?: string;
    avatarUrl?: string;
};

export const userRepository = {
    findByEmail: async (db: AppDb, email: string) => {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email));
        return result[0] ?? null;
    },

    findById: async (db: AppDb, id: string) => {
        const result = await db.select().from(users).where(eq(users.id, id));
        return result[0] ?? null;
    },

    emailExists: async (db: AppDb, email: string): Promise<boolean> => {
        const result = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email));
        return result.length > 0;
    },

    nicknameExists: async (db: AppDb, nickname: string): Promise<boolean> => {
        const result = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.nickname, nickname));
        return result.length > 0;
    },

    /**
     * Creates a user row AND an initial user_stats row atomically.
     * The schema requires user_stats for every user (1-to-1 relation).
     * Both inserts run inside a single transaction so a failure in either
     * leaves the database in a clean state (no orphaned user without stats).
     */
    create: async (db: AppDb, data: NewUser) => {
        return await db.transaction(async (tx) => {
            const [user] = await tx
                .insert(users)
                .values({
                    email: data.email,
                    nickname: data.nickname,
                    passwordHash: data.passwordHash,
                })
                .returning();

            await tx.insert(userStats).values({ userId: user.id });

            return user;
        });
    },

    update: async (db: AppDb, id: string, data: UpdateUser) => {
        const [updated] = await db
            .update(users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(users.id, id))
            .returning();
        return updated ?? null;
    },

    getStats: async (db: AppDb, userId: string) => {
        const result = await db
            .select()
            .from(userStats)
            .where(eq(userStats.userId, userId));
        return result[0] ?? null;
    },
};
