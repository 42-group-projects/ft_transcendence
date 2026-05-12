const {
    TICK_RATE,
    TICK_MS,
    MAX_PLAYERS_PER_ROOM,
    SOLO_CPU_DIFFICULTY,
    SOLO_CPU_ID,
    MAX_SPEED,
    DASH_IMPULSE,
    DASH_COOLDOWN_MS,
} = require('./constants');
const {
    clamp,
    sanitizeName,
    makePlayer,
    makeCPUball,
    makeRoom,
    placePlayerAtSpawnSlot,
    serializePlayers,
} = require('./player-utils');
const { createRoomRoundManager } = require('./room-round-manager');
const { createRoomSessionManager } = require('./room-session-manager');

function createRoomService(io, presenceManager) {
    const rooms = new Map();
    const userSessions = new Map();

    function normalizeSoloDifficulty(difficulty) {
        if (Object.hasOwn(SOLO_CPU_DIFFICULTY, difficulty)) {
            return difficulty;
        }

        return 'medium';
    }

    function makeSoloOpponent(room) {
        const label =
            room.soloDifficulty === 'dummy'
                ? 'Dummy'
                : `CPU (${room.soloDifficulty})`;
        const cpu = makeCPUball(SOLO_CPU_ID, label);
        placePlayerAtSpawnSlot(cpu, 1);
        return cpu;
    }

    function getSoloDifficultyConfig(difficulty) {
        return SOLO_CPU_DIFFICULTY[difficulty] || SOLO_CPU_DIFFICULTY.medium;
    }

    function countHumanPlayers(room) {
        return [...room.players.values()].filter((player) => !player.isCpu)
            .length;
    }

    function hasDisconnectedHuman(room) {
        return [...room.players.values()].some(
            (player) => !player.isCpu && player.disconnected,
        );
    }

    function buildGameState(room) {
        return {
            roomId: room.id,
            tick: room.tickCount,
            status: room.paused
                ? 'paused'
                : room.roundInProgress
                  ? 'active'
                  : 'waiting',
            players: serializePlayers(room.players),
        };
    }

    function emitGameState(room) {
        const payload = buildGameState(room);
        io.to(room.id).emit('game_state', payload);
        io.to(room.id).emit('roomState', payload);
    }

    function findRoomByUserId(userId) {
        const session = userSessions.get(userId);
        if (!session) {
            return null;
        }

        return rooms.get(session.roomId) || null;
    }

    function removeRoom(roomId) {
        const room = rooms.get(roomId);
        if (!room) {
            return;
        }

        if (room.interval) {
            clearInterval(room.interval);
        }

        sessionManager.clearAllReconnectTimers(room);

        for (const player of room.players.values()) {
            if (!player.isCpu) {
                userSessions.delete(player.userId);
            }
        }

        rooms.delete(roomId);
    }

    function removeHumanPlayer(room, userId) {
        const player = room.players.get(userId) || null;
        if (!player) {
            return null;
        }

        sessionManager.clearReconnectTimer(room, userId);

        if (player.socketId) {
            room.playerBySocketId.delete(player.socketId);
        }

        room.players.delete(userId);
        userSessions.delete(userId);

        return player;
    }

    function handleLeave(roomId, userId) {
        const room = rooms.get(roomId);
        if (!room) {
            return { room: null, player: null, removedRoom: false };
        }

        const player = removeHumanPlayer(room, userId);

        if (room.solo) {
            const hasHumanPlayer = [...room.players.values()].some(
                (currentPlayer) => !currentPlayer.isCpu,
            );
            if (!hasHumanPlayer) {
                removeRoom(roomId);
                return { room: null, player, removedRoom: true };
            }
        }

        if (countHumanPlayers(room) === 0) {
            removeRoom(roomId);
            return { room: null, player, removedRoom: true };
        }

        room.paused = false;

        if (roundManager.endRoundIfNeeded(room) || !rooms.has(room.id)) {
            return { room: null, player, removedRoom: true };
        }

        emitGameState(room);
        return { room, player, removedRoom: false };
    }

    const sessionManager = createRoomSessionManager({
        io,
        rooms,
        userSessions,
        removeRoom,
        emitGameState,
        findRoomByUserId,
        hasDisconnectedHuman,
        handleLeave,
        presenceManager,
    });

    const roundManager = createRoomRoundManager({
        io,
        emitGameState,
        countHumanPlayers,
        normalizeSoloDifficulty,
        makeSoloOpponent,
        getSoloDifficultyConfig,
        endSession: sessionManager.endSession,
    });

    function startRoomLoop(room) {
        if (room.interval) {
            clearInterval(room.interval);
        }

        room.interval = setInterval(() => {
            roundManager.tickRoom(room);
        }, TICK_MS);
    }

    function createRoom(password) {
        const room = makeRoom(password);
        rooms.set(room.id, room);
        startRoomLoop(room);
        return room;
    }

    function getRoom(roomId) {
        return rooms.get(roomId);
    }

    function addPlayerToRoom(room, { userId, socketId, rawName }) {
        const existing = room.players.get(userId);

        if (existing) {
            if (existing.socketId) {
                room.playerBySocketId.delete(existing.socketId);
            }

            existing.socketId = socketId;
            existing.disconnected = false;
            existing.name = sanitizeName(rawName || existing.name);
            room.playerBySocketId.set(socketId, userId);
            userSessions.set(userId, { roomId: room.id });
            sessionManager.clearReconnectTimer(room, userId);
            return existing;
        }

        const player = makePlayer({
            userId,
            socketId,
            name: sanitizeName(rawName),
        });
        const spawnIndex = countHumanPlayers(room);
        placePlayerAtSpawnSlot(player, spawnIndex);

        room.players.set(userId, player);
        room.playerBySocketId.set(socketId, userId);
        userSessions.set(userId, { roomId: room.id });

        return player;
    }

    function setPlayerInput(roomId, userId, x, z) {
        const room = rooms.get(roomId);
        if (!room) {
            return;
        }

        const player = room.players.get(userId);
        if (!player) {
            return;
        }

        if (
            !room.roundInProgress ||
            room.paused ||
            player.eliminated ||
            player.disconnected
        ) {
            player.input.x = 0;
            player.input.z = 0;
            return;
        }

        const nx = Number(x);
        const nz = Number(z);
        player.input.x = Number.isFinite(nx) ? clamp(nx, -1, 1) : 0;
        player.input.z = Number.isFinite(nz) ? clamp(nz, -1, 1) : 0;
    }

    // Apply a short forward jolt (dash) to the player's velocity if allowed by cooldown.
    function handlePlayerDash(roomId, userId) {
        const room = rooms.get(roomId);
        if (!room) {
            return;
        }

        const player = room.players.get(userId);
        if (!player) {
            return;
        }

        if (
            !room.roundInProgress ||
            room.paused ||
            player.eliminated ||
            player.disconnected
        ) {
            return;
        }

        const now = Date.now();

        if (player.lastDashAt && now - player.lastDashAt < DASH_COOLDOWN_MS) {
            return; // still on cooldown
        }

        player.lastDashAt = now;
        // Emit dash_confirmed to the player who successfully dashed
        if (player.socketId) {
            io.to(player.socketId).emit('dash_confirmed');
        }
        const heading = Number(player.heading) || 0;
        const forwardX = Math.sin(heading);
        const forwardZ = -Math.cos(heading);

        const vxBefore = Number(player.velocity.x) || 0;
        const vzBefore = Number(player.velocity.z) || 0;
        const speedBefore = Math.hypot(vxBefore, vzBefore);

        // project current velocity onto forward vector and perpendicular component
        const projBefore = vxBefore * forwardX + vzBefore * forwardZ;
        const perpX = vxBefore - forwardX * projBefore;
        const perpZ = vzBefore - forwardZ * projBefore;

        // increase forward projection by DASH_IMPULSE (guarded)
        const dashImpulse = Number(DASH_IMPULSE) || 0;
        const projAfter =
            Number.isFinite(projBefore) && Number.isFinite(dashImpulse)
                ? projBefore + dashImpulse
                : projBefore;

        let newVx = perpX + forwardX * projAfter;
        let newVz = perpZ + forwardZ * projAfter;

        // cap to MAX_SPEED if present
        const speedAfterUncapped = Math.hypot(newVx, newVz);
        if (Number.isFinite(MAX_SPEED) && speedAfterUncapped > MAX_SPEED) {
            const scale = MAX_SPEED / speedAfterUncapped;
            newVx *= scale;
            newVz *= scale;
        }

        // apply sanitized values
        player.velocity.x = Number.isFinite(newVx) ? newVx : vxBefore;
        player.velocity.z = Number.isFinite(newVz) ? newVz : vzBefore;

        // debug log for dash (can be removed later)
        try {
            // eslint-disable-next-line no-console
            console.debug(
                `dash: user=${userId} heading=${heading.toFixed(3)} vxBefore=${vxBefore.toFixed(3)} vzBefore=${vzBefore.toFixed(3)} projBefore=${projBefore.toFixed(3)} projAfter=${projAfter.toFixed(3)} speedBefore=${speedBefore.toFixed(3)} speedAfter=${Math.hypot(player.velocity.x, player.velocity.z).toFixed(3)}`,
            );
        } catch (e) {}
    }

    function isRoomPasswordValid(room, password) {
        return room.password === (password || '').trim();
    }

    function isRoomFull(room) {
        return countHumanPlayers(room) >= MAX_PLAYERS_PER_ROOM;
    }

    function isRoundInProgress(room) {
        return room.roundInProgress;
    }

    return {
        TICK_RATE,
        createRoom,
        getRoom,
        findRoomByUserId,
        addPlayerToRoom,
        setPlayerInput,
        tryStartRound: roundManager.tryStartRound,
        startSoloRound: roundManager.startSoloRound,
        handleLeave,
        handleDisconnect: sessionManager.handleDisconnect,
        reconnectPlayer: sessionManager.reconnectPlayer,
        isRoomPasswordValid,
        isRoomFull,
        isRoundInProgress,
        handlePlayerDash,
        notifyWaitingForOpponent: roundManager.notifyWaitingForOpponent,
        broadcastRoomState: emitGameState,
        getRoomCount: () => rooms.size,
    };
}

module.exports = {
    createRoomService,
};
