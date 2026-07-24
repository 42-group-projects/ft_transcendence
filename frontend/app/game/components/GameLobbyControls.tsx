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
    return (
        <>
            {/* <div className="grid gap-3  border border-neutral-700 bg-neutral-900 p-4 md:grid-cols-5">
                <input
                    className="rounded border border-neutral-600 bg-neutral-800 px-3 py-2 outline-none"
                    value={name}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="Player name"
                />
                <input
                    className="rounded border border-neutral-600 bg-neutral-800 px-3 py-2 outline-none"
                    value={roomId}
                    onChange={(event) => onRoomIdChange(event.target.value)}
                    placeholder="Room ID"
                />
                <input
                    className="rounded border border-neutral-600 bg-neutral-800 px-3 py-2 outline-none"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    placeholder="Room password"
                    type="password"
                />

                <button
                    className="rounded bg-blue-600 px-3 py-2 font-medium hover:bg-blue-500"
                    onClick={onCreateRoom}
                    type="button"
                >
                    Create room
                </button>

                <button
                    className="rounded bg-orange-600 px-3 py-2 font-medium hover:bg-orange-500"
                    onClick={onJoinRoom}
                    type="button"
                >
                    Join room
                </button>
            </div> */}

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-700">
                <span>Socket: {connected ? 'connected' : 'disconnected'}</span>
                <span>Room: {joinedRoomId ?? 'none'}</span>
                <span>Players: {playersCount}</span>
                {joinedRoomId ? (
                    <button
                        className="rounded border-2 border-neutral-600 px-2 py-1 text-stone-900 hover:bg-stone-100"
                        onClick={onLeaveRoom}
                        type="button"
                    >
                        Leave room
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
