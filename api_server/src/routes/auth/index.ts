import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { registerSchema, loginSchema } from './schemas';
import { authService } from '../../service/authService';

export const authRoutes = new Hono();

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

// --- Routes ---
authRoutes.post(
    '/register',
    zValidator('json', registerSchema, (result, c) => {
        if (!result.success) {
            const first = result.error.issues[0];
            return c.json(
                { error: first?.message ?? 'Invalid request data' },
                400,
            );
        }
    }),
    async (c) => {
        const { email, nickname, password } = c.req.valid('json');
        const { access_token, user } = await authService.register(
            email,
            nickname,
            password,
        );
        return c.json({ access_token, user: toPublicUser(user) }, 201);
    },
);

authRoutes.post(
    '/login',
    zValidator('json', loginSchema, (result, c) => {
        if (!result.success) {
            const first = result.error.issues[0];
            return c.json(
                { error: first?.message ?? 'Invalid request data' },
                400,
            );
        }
    }),
    async (c) => {
        const { email, password } = c.req.valid('json');
        const { access_token, user } = await authService.login(email, password);
        return c.json({ access_token, user: toPublicUser(user) }, 200);
    },
);

// JWT is stateless — client discards the token. Endpoint exists as clean API contract.
authRoutes.post('/logout', (c) =>
    c.json({ message: 'Logged out successfully' }, 200),
);
