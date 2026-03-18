import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { PLAYER_RADIUS, WORLD_SIZE } from "../constants";
import type { PlayerState } from "../types";

type FollowCameraProps = {
  target: THREE.Vector3 | null;
};

function FollowCamera({ target }: FollowCameraProps) {
  const { camera } = useThree();

  useFrame(() => {
    if (!target) {
      return;
    }

    const desired = new THREE.Vector3(target.x, target.y + 6, target.z + 7);
    camera.position.lerp(desired, 0.12);
    camera.lookAt(target.x, target.y, target.z);
  });

  return null;
}

type WorldSceneProps = {
  players: PlayerState[];
  localPlayerId: string | null;
};

export function WorldScene({ players, localPlayerId }: WorldSceneProps) {
  const localPlayer = useMemo(
    () => players.find((player) => player.id === localPlayerId) || null,
    [players, localPlayerId]
  );

  const target = localPlayer
    ? new THREE.Vector3(
        localPlayer.position.x,
        localPlayer.position.y,
        localPlayer.position.z
      )
    : null;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight intensity={1.2} position={[8, 12, 8]} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#2f2f2f" />
      </mesh>

      <mesh position={[0, 2, -WORLD_SIZE / 2]}>
        <boxGeometry args={[WORLD_SIZE, 4, 0.4]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      <mesh position={[0, 2, WORLD_SIZE / 2]}>
        <boxGeometry args={[WORLD_SIZE, 4, 0.4]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      <mesh position={[-WORLD_SIZE / 2, 2, 0]}>
        <boxGeometry args={[0.4, 4, WORLD_SIZE]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      <mesh position={[WORLD_SIZE / 2, 2, 0]}>
        <boxGeometry args={[0.4, 4, WORLD_SIZE]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>

      {players.map((player) => {
        const isSelf = player.id === localPlayerId;

        return (
          <group
            key={player.id}
            position={[player.position.x, player.position.y, player.position.z]}
          >
            <mesh castShadow>
              <sphereGeometry args={[PLAYER_RADIUS, 24, 24]} />
              <meshStandardMaterial color={isSelf ? "#3b82f6" : "#f97316"} />
            </mesh>
            <mesh position={[0, PLAYER_RADIUS + 0.35, 0]}>
              <planeGeometry args={[1.8, 0.45]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.35} />
            </mesh>
          </group>
        );
      })}

      <FollowCamera target={target} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  );
}
