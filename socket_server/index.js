const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const {
    PORT,
    JWT_SECRET,
    SOCKET_CORS,
    TLS_KEY_PATH,
    TLS_CERT_PATH,
} = require('./config');
const { createRoomService } = require('./game/room-service');
const { registerSocketHandlers } = require('./socket-handlers');
const presenceManager = require('./presence-manager');

const app = express();
app.use(cors(SOCKET_CORS));

// The browser connects to this server directly (cross-origin from the
// frontend), so it must be served over TLS (wss://). Internal calls between
// backend services still use plain HTTP.
const server = https.createServer(
    {
        key: fs.readFileSync(TLS_KEY_PATH),
        cert: fs.readFileSync(TLS_CERT_PATH),
    },
    app,
);
const io = new Server(server, {
    cors: SOCKET_CORS,
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error('AUTH_MISSING_TOKEN'));
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const userId = payload?.sub;

        if (!userId || typeof userId !== 'string') {
            return next(new Error('AUTH_INVALID_TOKEN'));
        }

        socket.data.userId = userId;
        next();
    } catch {
        return next(new Error('AUTH_INVALID_TOKEN'));
    }
});

const roomService = createRoomService(io, presenceManager);

registerSocketHandlers(io, roomService);

app.get('/health', (_, res) => {
    res.json({
        status: 'ok',
        tickRate: roomService.TICK_RATE,
        rooms: roomService.getRoomCount(),
    });
});

server.listen(PORT, () => {
    console.log(`Socket server running on :${PORT}`);
});
