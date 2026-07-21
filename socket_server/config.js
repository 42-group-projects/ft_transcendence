const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'mock-super-secret-dev-key';
const RECONNECT_GRACE_MS = Number(process.env.RECONNECT_GRACE_MS || 30000);
const API_URL = process.env.API_URL || 'http://api-server:4001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
const TLS_KEY_PATH = process.env.TLS_KEY_PATH || '/certs/key.pem';
const TLS_CERT_PATH = process.env.TLS_CERT_PATH || '/certs/cert.pem';

// The browser reaches this server on a different port than the frontend, so it
// is a cross-origin connection and CORS must allow the frontend origin.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://localhost:3000';
const SOCKET_CORS = {
    origin: [FRONTEND_ORIGIN],
    methods: ['GET', 'POST'],
    credentials: true,
};

module.exports = {
    PORT,
    JWT_SECRET,
    RECONNECT_GRACE_MS,
    SOCKET_CORS,
    API_URL,
    INTERNAL_SECRET,
    TLS_KEY_PATH,
    TLS_CERT_PATH,
};
