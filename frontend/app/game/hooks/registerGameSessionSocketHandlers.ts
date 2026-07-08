import type { Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';

import type { GameConstants, PlayerState, RoomStatePayload } from '../types';

type RegisterGameSessionSocketHandlersArgs = {
    socket: Socket;
    socketUrl: string;
    onRoomCreated?: (roomId: string) => void;
    setConnected: Dispatch<SetStateAction<boolean>>;
    setJoinedRoomId: Dispatch<SetStateAction<string | null>>;
    setLocalPlayerId: Dispatch<SetStateAction<string | null>>;
    setPlayers: Dispatch<SetStateAction<PlayerState[]>>;
    setErrorMessage: Dispatch<SetStateAction<string | null>>;
    setSystemMessage: Dispatch<SetStateAction<string | null>>;
    setRoundResultMessage: Dispatch<SetStateAction<string | null>>;
    setSessionEndedReason: Dispatch<SetStateAction<string | null>>;
    setIsPaused: Dispatch<SetStateAction<boolean>>;
    setCountdown: Dispatch<SetStateAction<number | null>>;
    setGameConstants: Dispatch<SetStateAction<GameConstants | null>>;
};

export function registerGameSessionSocketHandlers({
    socket,
    socketUrl,
    onRoomCreated,
    setConnected,
    setJoinedRoomId,
    setLocalPlayerId,
    setPlayers,
    setErrorMessage,
    setSystemMessage,
    setRoundResultMessage,
    setSessionEndedReason,
    setIsPaused,
    setCountdown,
    setGameConstants,
}: RegisterGameSessionSocketHandlersArgs) {
    const syncRoomState = ({
        players: nextPlayers,
        status,
    }: RoomStatePayload) => {
        setPlayers(nextPlayers);
        setIsPaused(status === 'paused');
    };

    const onConnect = () => {
        setConnected(true);
        setErrorMessage(null);
        socket.emit('reconnect');
    };

    const onGameConstants = (constants: GameConstants) => {
        setGameConstants(constants);
    };

    const onDisconnect = () => {
        setConnected(false);
        setSystemMessage('Connection lost. Trying to reconnect...');
    };

    const onConnectError = (error: Error) => {
        setConnected(false);
        const message =
            error?.message === 'AUTH_MISSING_TOKEN' ||
            error?.message === 'AUTH_INVALID_TOKEN'
                ? 'Authentication failed. Please login again.'
                : `Unable to reach socket server at ${socketUrl}`;
        setErrorMessage(message);
    };

    const onRoomCreatedEvt = ({ roomId }: { roomId: string }) => {
        onRoomCreated?.(roomId);
        setSystemMessage(`Room created: ${roomId}`);
        setErrorMessage(null);
    };

    const onJoinedRoom = ({
        roomId,
        playerId,
    }: {
        roomId: string;
        playerId: string;
    }) => {
        setJoinedRoomId(roomId);
        setLocalPlayerId(playerId);
        setErrorMessage(null);
        setRoundResultMessage(null);
        setSessionEndedReason(null);
        setSystemMessage(null);
        setCountdown(null);
    };

    const onRoomError = ({ message }: { message: string }) =>
        setErrorMessage(message);
    const onSystemMessage = ({ message }: { message: string }) =>
        setSystemMessage(message);
    const onOpponentDisconnected = ({ timeoutMs }: { timeoutMs: number }) => {
        setIsPaused(true);
        setSystemMessage(
            `Opponent disconnected. Waiting up to ${Math.ceil(timeoutMs / 1000)} seconds...`,
        );
    };
    const onOpponentReconnected = () =>
        setSystemMessage('Opponent reconnected.');
    const onCountdown = ({
        secondsRemaining,
    }: {
        secondsRemaining: number;
    }) => {
        setCountdown(secondsRemaining);
        if (secondsRemaining === 0) setIsPaused(false);
    };
    const onSessionEnded = ({
        reason,
        message,
    }: {
        reason: string;
        message?: string;
    }) => {
        setSessionEndedReason(reason);
        setIsPaused(false);
        setJoinedRoomId(null);
        setLocalPlayerId(null);
        setPlayers([]);
        setCountdown(null);
        if (message) setSystemMessage(message);
    };
    const onRoundStarted = () => {
        setSystemMessage(null);
        setRoundResultMessage(null);
        setCountdown(null);
        setSessionEndedReason(null);
    };
    const onResult = ({ message }: { message: string }) =>
        setRoundResultMessage(message);

    const onRoomTimeout = ({ message }: { message: string }) => {
        setSessionEndedReason('room_timeout');
        setIsPaused(false);
        setJoinedRoomId(null);
        setLocalPlayerId(null);
        setPlayers([]);
        setCountdown(null);
        setSystemMessage(message);
    };

    socket.on('connect', onConnect);
    socket.on('gameConstants', onGameConstants);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('roomCreated', onRoomCreatedEvt);
    socket.on('joinedRoom', onJoinedRoom);
    socket.on('game_state', syncRoomState);
    socket.on('roomState', syncRoomState);
    socket.on('roomError', onRoomError);
    socket.on('systemMessage', onSystemMessage);
    socket.on('opponent_disconnected', onOpponentDisconnected);
    socket.on('opponent_reconnected', onOpponentReconnected);
    socket.on('countdown', onCountdown);
    socket.on('session_ended', onSessionEnded);
    socket.on('roundStarted', onRoundStarted);
    socket.on('result', onResult);
    socket.on('roundResult', onResult);
    socket.on('roomTimeout', onRoomTimeout);

    // Returns a cleanup function that removes only these handlers,
    // leaving other listeners (e.g. presence) untouched.
    return () => {
        socket.off('connect', onConnect);
        socket.off('gameConstants', onGameConstants);
        socket.off('disconnect', onDisconnect);
        socket.off('connect_error', onConnectError);
        socket.off('roomCreated', onRoomCreatedEvt);
        socket.off('joinedRoom', onJoinedRoom);
        socket.off('game_state', syncRoomState);
        socket.off('roomState', syncRoomState);
        socket.off('roomError', onRoomError);
        socket.off('systemMessage', onSystemMessage);
        socket.off('opponent_disconnected', onOpponentDisconnected);
        socket.off('opponent_reconnected', onOpponentReconnected);
        socket.off('countdown', onCountdown);
        socket.off('session_ended', onSessionEnded);
        socket.off('roundStarted', onRoundStarted);
        socket.off('result', onResult);
        socket.off('roundResult', onResult);
        socket.off('roomTimeout', onRoomTimeout);
    };
}
