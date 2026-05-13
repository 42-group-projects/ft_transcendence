import { Hono } from 'hono';
import { analysisRoutes } from './analysis/index';

const app = new Hono()
    .route('/analysis', analysisRoutes)

    .get('/', (c) => {
        return c.text('This is the mock API root.');
    })

    .get('/health', (c) => {
        return c.text('Mock API is healthy!');
    });

export { app as mockRoutes };
