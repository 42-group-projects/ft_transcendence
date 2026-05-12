const express = require('express');
const http = require('http');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { PORT, JWT_SECRET, SOCKET_CORS } = require('./config');
const { createRoomService } = require('./game/room-service');
const { registerSocketHandlers } = require('./socket-handlers');
const presenceManager = require('./presence-manager');

const app = express();
app.use(cors());

const server = http.createServer(app);
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
