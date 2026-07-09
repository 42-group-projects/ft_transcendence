import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { userService } from '../../service/userService';
import type { AuthEnv } from '../../middleware/auth';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { sql, and } from 'drizzle-orm';
import { users } from '../../db/schema';
import { createDbClient } from '../../repository/dbClient';

export const usersRoutes = new Hono<AuthEnv>();

function toPublicUser(user: Record<string, any>) {
    return {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar_url: user.avatarUrl ?? '/api/uploads/default-avatar.svg',
        created_at:
            user.createdAt instanceof Date
                ? user.createdAt.toISOString()
                : user.createdAt,
        updated_at:
            user.updatedAt instanceof Date
                ? user.updatedAt.toISOString()
                : user.updatedAt,
    };
}

// All routes require authMiddleware applied at the router level in routes/index.ts.
// c.get("userId") is the verified caller's UUID from the JWT.

const updateMeSchema = z
    .object({
        nickname: z.string().min(1).max(20).optional(),
        avatar_url: z.string().optional(),
    })
    .refine((d) => d.nickname !== undefined || d.avatar_url !== undefined, {
        message: 'UNPROCESSABLE',
    });

// GET /users/me
usersRoutes.get('/me', async (c) => {
    const userId = c.get('userId') as string;
    const user = await userService.getById(userId);
    return c.json({ user: toPublicUser(user) });
});

// PATCH /users/me
usersRoutes.patch('/me', zValidator('json', updateMeSchema), async (c) => {
    const userId = c.get('userId') as string;
    const updated = await userService.updateMe(userId, c.req.valid('json'));
    return c.json({ user: toPublicUser(updated) });
});

// GET /users/me/stats
usersRoutes.get('/me/stats', async (c) => {
    const userId = c.get('userId') as string;
    const stats = await userService.getStats(userId);
    return c.json({ stats });
});

// GET /users/search — search users by nickname
usersRoutes.get('/search', async (c) => {
    const nickname = c.req.query('nickname');
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
        return c.json({ users: [] });
    }
    const { db, close } = createDbClient();
    try {
        const foundUsers = await db
            .select({
                id: users.id,
                nickname: users.nickname,
                avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(
                and(
                    sql`lower(${users.nickname}) like ${'%' + nickname.toLowerCase() + '%'}`,
                    sql`${users.id} <> ${c.get('userId')}`
                )
            )
            .limit(10);
        return c.json({
            users: foundUsers.map(u => ({
                id: u.id,
                nickname: u.nickname,
                avatar_url: u.avatarUrl ?? '/api/uploads/default-avatar.svg'
            }))
        });
    } finally {
        await close();
    }
});

// POST /users/me/avatar — upload avatar file
usersRoutes.post('/me/avatar', async (c) => {
    const userId = c.get('userId') as string;
    const body = await c.req.parseBody();
    const file = body['avatar'];

    if (!file || !(file instanceof File)) {
        return c.json({ error: 'No file uploaded' }, 400);
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        return c.json({ error: 'File size exceeds 5MB limit' }, 400);
    }

    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const fileExt = extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
        return c.json({ error: 'Invalid file type. Allowed types: png, jpg, jpeg, gif, webp, svg' }, 400);
    }

    const uploadsDir = join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const uniqueFilename = `${userId}-${Date.now()}${fileExt}`;
    const filePath = join(uploadsDir, uniqueFilename);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    const avatarUrl = `/api/uploads/${uniqueFilename}`;
    const updated = await userService.updateMe(userId, { avatar_url: avatarUrl });

    return c.json({ user: toPublicUser(updated) });
});

// GET /users/:id — returns a public profile with no email exposed
usersRoutes.get('/:id', async (c) => {
    const id = c.req.param('id');
    const user = await userService.getById(id);
    return c.json({
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatarUrl ?? '/api/uploads/default-avatar.svg',
        created_at:
            user.createdAt instanceof Date
                ? user.createdAt.toISOString()
                : user.createdAt,
    });
});

// GET /users/:id/stats
usersRoutes.get('/:id/stats', async (c) => {
    const id = c.req.param('id');
    const stats = await userService.getStats(id);
    return c.json({ data: stats });
});
