import { timingSafeEqual } from 'node:crypto';
import { createMiddleware } from 'hono/factory';

const INTERNAL_SECRET_HEADER = 'X-Internal-Secret';

function secretsMatch(actual: string, expected: string) {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);

    if (actualBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
}

export const internalAuthMiddleware = createMiddleware(async (c, next) => {
    const expectedSecret = process.env.INTERNAL_SECRET;

    if (!expectedSecret) {
        console.error('INTERNAL_SECRET is not set');
        return c.json({ error: 'INTERNAL_ERROR' }, 500);
    }

    const actualSecret = c.req.header(INTERNAL_SECRET_HEADER);

    if (!actualSecret) {
        return c.json({ error: 'UNAUTHORIZED' }, 401);
    }

    if (!secretsMatch(actualSecret, expectedSecret)) {
        return c.json({ error: 'FORBIDDEN' }, 403);
    }

    await next();
});
