type GameLobbyControlsProps = {
    roomId: string;
    password: string;
    connected: boolean;
    joinedRoomId: string | null;
    playersCount: number;
    errorMessage: string | null;
    systemMessage: string | null;
    roundResultMessage: string | null;
    onRoomIdChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onCreateRoom: () => void;
    onJoinRoom: () => void;
    onLeaveRoom: () => void;
};

export function GameLobbyControls({
    roomId,
    password,
    connected,
    joinedRoomId,
    playersCount,
    errorMessage,
    systemMessage,
    roundResultMessage,
    onRoomIdChange,
    onPasswordChange,
    onCreateRoom,
    onJoinRoom,
    onLeaveRoom,
}: GameLobbyControlsProps) {
    const handleLeaveRoom = () => {
        onLeaveRoom();
        window.location.href = '/lobby';
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-700">
                <span>Socket: {connected ? 'connected' : 'disconnected'}</span>
                <span>Room: {joinedRoomId ?? 'none'}</span>
                <span>Players: {playersCount}</span>
                {joinedRoomId ? (
                    <button
                        className="rounded border-2 border-neutral-600 px-2 py-1 text-stone-900 hover:bg-stone-100 bg-red-700"
                        onClick={handleLeaveRoom}
                        type="button"
                    >
                        Forfit
                    </button>
                ) : null}
            </div>

            {errorMessage ? (
                <p className="text-sm text-red-700">{errorMessage}</p>
            ) : null}
            {systemMessage ? (
                <p className="text-sm text-green-700">{systemMessage}</p>
            ) : null}
            {roundResultMessage ? (
                <p className="text-base font-semibold text-amber-800">
                    {roundResultMessage}
                </p>
            ) : null}
        </>
    );
}
