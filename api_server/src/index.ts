import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { apiRoutes } from './routes/index';
import { ApiError } from './utils/apiError';

// Browser calls reach this server same-origin via the frontend's /api rewrite,
// so CORS is effectively unused for the browser. Restrict it to the frontend
// origin as defence-in-depth for any direct cross-origin request.
const frontendOrigin = process.env.FRONTEND_ORIGIN ?? 'https://localhost:3000';
const app = new Hono()
    .use('/*', cors({ origin: [frontendOrigin], credentials: true }))
    .route('/', apiRoutes);

app.onError((err, c) => {
    if (err instanceof ApiError) {
        return c.json({ error: err.message }, err.statusCode as any);
    }
    console.error(err);
    return c.json({ error: 'INTERNAL_ERROR' }, 500);
});

const port = Number(process.env.PORT ?? 4001);

serve({ fetch: app.fetch, port }, () => {
    console.log(`API server running on :${port}`);
});
