import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['three'],
    turbopack: {},
    // Proxy browser /api/* calls to the API server over the internal Docker
    // network. The browser only ever talks to the (HTTPS) Next.js origin, so
    // the API server itself does not need TLS.
    async rewrites() {
        const apiInternalUrl =
            process.env.API_INTERNAL_URL ?? 'http://api-server:4001';
        return [
            {
                source: '/api/:path*',
                destination: `${apiInternalUrl}/api/:path*`,
            },
        ];
    },
};

export default nextConfig;
