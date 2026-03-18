import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import { PLAYER_RADIUS, WORLD_SIZE } from "../constants";
import type { PlayerState } from "../types";

type FollowCameraProps = {
  target: THREE.Vector3 | null;
  heading: number;
};

function FollowCamera({ target, heading }: FollowCameraProps) {
  const { camera } = useThree();

  useFrame(() => {
    if (!target) {
      return;
    }

    const cameraDistance = 7;
    const lookAheadDistance = 2;
    const forwardX = Math.sin(heading);
    const forwardZ = -Math.cos(heading);
    const desired = new THREE.Vector3(
      target.x - forwardX * cameraDistance,
      target.y + 6,
      target.z - forwardZ * cameraDistance
    );

    const lookAt = new THREE.Vector3(
      target.x + forwardX * lookAheadDistance,
      target.y,
      target.z + forwardZ * lookAheadDistance
    );

    camera.position.lerp(desired, 0.12);
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
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

  const heading = localPlayer?.heading ?? 0;

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

      <FollowCamera target={target} heading={heading} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  );
}
