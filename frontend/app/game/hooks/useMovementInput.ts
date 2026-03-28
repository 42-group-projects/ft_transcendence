import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";

type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

function createEmptyInputState(): InputState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
  };
}

export function useMovementInput({
  joinedRoomId,
  socketRef,
  onDash,
}: {
  joinedRoomId: string | null;
  socketRef: MutableRefObject<Socket | null>;
  onDash?: () => void;
}) {
  const inputRef = useRef<InputState>(createEmptyInputState());

  useEffect(() => {
    if (!joinedRoomId) {
      inputRef.current = createEmptyInputState();
      return;
    }

    const socket = socketRef.current;

    const handleKey = (event: KeyboardEvent, pressed: boolean) => {
      if (event.repeat) {
        return;
      }

      if (event.code === "KeyW" || event.code === "ArrowUp") {
        inputRef.current.up = pressed;
      }
      if (event.code === "KeyS" || event.code === "ArrowDown") {
        inputRef.current.down = pressed;
      }
      if (event.code === "KeyA" || event.code === "ArrowLeft") {
        inputRef.current.left = pressed;
      }
      if (event.code === "KeyD" || event.code === "ArrowRight") {
        inputRef.current.right = pressed;
      }
      if (event.code === "Space") {
        // only emit dash on keydown
        if (pressed) {
          // event.preventDefault();
          // Instead of triggering dash cooldown here, only emit dash event
          socket?.emit("dash");
        }
      }
    };

    const onKeyDown = (event: KeyboardEvent) => handleKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => handleKey(event, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Listen for dash confirmation from server
    function handleDashConfirmed() {
      if (typeof onDash === "function") {
        try {
          onDash();
        } catch (e) {}
      }
    }
    socket?.on && socket.on("dash_confirmed", handleDashConfirmed);

    const sendInput = setInterval(() => {
      const x = Number(inputRef.current.right) - Number(inputRef.current.left);
      const z = Number(inputRef.current.down) - Number(inputRef.current.up);
      socket?.emit("move", { x, z });
    }, 1000 / 30);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearInterval(sendInput);
      inputRef.current = createEmptyInputState();
      socket?.emit("move", { x: 0, z: 0 });
      socket?.off && socket.off("dash_confirmed", handleDashConfirmed);
    };
  }, [joinedRoomId, socketRef]);
}
