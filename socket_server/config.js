const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'mock-super-secret-dev-key';
const RECONNECT_GRACE_MS = Number(process.env.RECONNECT_GRACE_MS || 30000);
const API_URL = process.env.API_URL || 'http://api-server:4001';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;

const SOCKET_CORS = {
    origin: '*',
    methods: ['GET', 'POST'],
};

module.exports = {
    PORT,
    JWT_SECRET,
    RECONNECT_GRACE_MS,
    SOCKET_CORS,
    API_URL,
    INTERNAL_SECRET,
};
