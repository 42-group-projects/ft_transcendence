import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { Socket } from "socket.io-client";

type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export function useMovementInput({
  joinedRoomId,
  socketRef,
}: {
  joinedRoomId: string | null;
  socketRef: MutableRefObject<Socket | null>;
}) {
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    if (!joinedRoomId) {
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
    };

    const onKeyDown = (event: KeyboardEvent) => handleKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => handleKey(event, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const sendInput = setInterval(() => {
      const x = Number(inputRef.current.right) - Number(inputRef.current.left);
      const z = Number(inputRef.current.down) - Number(inputRef.current.up);

      socket?.emit("moveInput", { x, z });
    }, 1000 / 30);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearInterval(sendInput);
      socket?.emit("moveInput", { x: 0, z: 0 });
    };
  }, [joinedRoomId, socketRef]);
}
