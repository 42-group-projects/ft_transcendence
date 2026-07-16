import { Hono } from 'hono';
import { friendsRoute } from './friends/index';
import { analysisRoutes } from './analysis/index';
import { adminRoutes } from './admin/index';
import { mockRoutes } from './mock/index';
import { authRoutes } from './auth/index';
import { usersRoutes } from './users/index';
import { internalRoutes } from './internal/index';
import { authMiddleware } from '../middleware/auth';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { internalAuthMiddleware } from '../middleware/internalAuth';

const defaultAvatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#grad)" />
  <circle cx="50" cy="40" r="20" fill="#ffffff" opacity="0.9" />
  <path d="M20,80 C20,65 30,55 50,55 C70,55 80,65 80,80" fill="#ffffff" opacity="0.9" />
</svg>`;

async function ensureDefaultAvatar() {
    const uploadsDir = join(process.cwd(), 'uploads');
    try {
        await fs.mkdir(uploadsDir, { recursive: true });
        const filePath = join(uploadsDir, 'default-avatar.svg');
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, defaultAvatarSvg);
        }
    } catch (err) {
        console.error('Failed to create default avatar:', err);
    }
}
ensureDefaultAvatar();

const app = new Hono()
    .basePath('/api')
    // Public
    .route('/auth', authRoutes)
    // Protected — JWT required
    .use('/users/*', authMiddleware)
    .route('/users', usersRoutes)
    .use('/friends/*', authMiddleware)
    .use('/friends', authMiddleware)
    .route('/friends', friendsRoute)
    // Public / Internal uploads route
    .get('/uploads/:filename', async (c) => {
        const filename = basename(c.req.param('filename'));
        const filePath = join(process.cwd(), 'uploads', filename);
        try {
            const fileContent = await fs.readFile(filePath);
            let contentType = 'application/octet-stream';
            if (filename.endsWith('.png')) contentType = 'image/png';
            else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
            else if (filename.endsWith('.gif')) contentType = 'image/gif';
            else if (filename.endsWith('.svg')) contentType = 'image/svg+xml';
            else if (filename.endsWith('.webp')) contentType = 'image/webp';
            
            return c.body(fileContent, 200, {
                'Content-Type': contentType,
            });
        } catch (e) {
            return c.text('Not Found', 404);
        }
    })
    // Internal / tooling
    .use('/analysis/*', authMiddleware)
    .use('/analysis', authMiddleware)
    .route('/mock', mockRoutes)
    .route('/analysis', analysisRoutes)
    .use('/admin/*', authMiddleware)
    .use('/admin', authMiddleware)
    .route('/admin', adminRoutes)
    // Internal — validated by X-Internal-Secret header, no JWT
    .use('/internal/*', internalAuthMiddleware)
    .use('/internal', internalAuthMiddleware)
    .route('/internal', internalRoutes)
    .get('/', (c) => {
        return c.text('This is the API root.');
    })
    .get('/health', (c) => {
        return c.text('API is healthy!');
    });

export { app as apiRoutes };
