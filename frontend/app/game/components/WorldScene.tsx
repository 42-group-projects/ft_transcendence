import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import {
    SPAWN_DISTANCE as IMPORTED_SPAWN_DISTANCE,
    SPAWN_LINE_OFFSET,
} from '../constants';
import type { GameConstants, PlayerState } from '../types';
import { DOHYO_THEMES, type DohyoTheme } from '../hooks/useCustomization';
import { Player } from '../components/Player';
import { Environment } from '@react-three/drei';

const PLATE_THICKNESS = 0.5;
const SPAWN_LINE_LENGTH = 3.6;
const SPAWN_LINE_THICKNESS = 0.12;

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
            target.z - forwardZ * cameraDistance,
        );

        const lookAt = new THREE.Vector3(
            target.x + forwardX * lookAheadDistance,
            target.y,
            target.z + forwardZ * lookAheadDistance,
        );

        camera.position.lerp(desired, 0.12);
        camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    });

    return null;
}

type WorldSceneProps = {
    players: PlayerState[];
    localPlayerId: string | null;
    gameConstants?: GameConstants | null;
    mawashiColor?: string;
    dohyoTheme?: DohyoTheme;
};

export function WorldScene({
    players,
    localPlayerId,
    gameConstants,
    mawashiColor = '#3b82f6',
    dohyoTheme = 'default',
}: WorldSceneProps) {
    // Use passed constants or fallback to imports (for backwards compatibility)
    const SPAWN_DISTANCE =
        gameConstants?.SPAWN_DISTANCE ?? IMPORTED_SPAWN_DISTANCE;
    const WORLD_SIZE = gameConstants?.WORLD_HALF
        ? gameConstants.WORLD_HALF * 2
        : 22;
    const PLATE_RADIUS = WORLD_SIZE / 2;

    const theme = DOHYO_THEMES[dohyoTheme];

    const localPlayer = useMemo(
        () => players.find((player) => player.id === localPlayerId) || null,
        [players, localPlayerId],
    );

    const target = localPlayer
        ? new THREE.Vector3(
              localPlayer.position.x,
              localPlayer.position.y,
              localPlayer.position.z,
          )
        : null;

    const heading = localPlayer?.heading ?? 0;

    return (
        <>
            <Environment
                preset="studio"
                // files={'../images/sky_04_2k.png'}
                background
            />
            <ambientLight intensity={0.6} />
            <directionalLight
                intensity={1.2}
                position={[8, 12, 8]}
                castShadow
            />

            <mesh position={[0, -PLATE_THICKNESS / 2, 0]} receiveShadow>
                <cylinderGeometry
                    args={[PLATE_RADIUS, PLATE_RADIUS, PLATE_THICKNESS, 80]}
                />
                <meshStandardMaterial color={theme.surface} />
            </mesh>

            <mesh
                position={[0, 0.02, SPAWN_DISTANCE - SPAWN_LINE_OFFSET]}
                receiveShadow
            >
                <boxGeometry
                    args={[SPAWN_LINE_LENGTH, SPAWN_LINE_THICKNESS, 0.18]}
                />
                <meshStandardMaterial
                    color={theme.border}
                    emissive={theme.border}
                    emissiveIntensity={0.3}
                />
            </mesh>

            <mesh
                position={[0, 0.02, -SPAWN_DISTANCE + SPAWN_LINE_OFFSET]}
                receiveShadow
            >
                <boxGeometry
                    args={[SPAWN_LINE_LENGTH, SPAWN_LINE_THICKNESS, 0.18]}
                />
                <meshStandardMaterial
                    color={theme.border}
                    emissive={theme.border}
                    emissiveIntensity={0.3}
                />
            </mesh>

            {players.map((player) => {
                const isSelf = player.id === localPlayerId;

                return (
                    <Player
                        key={player.id}
                        player={player}
                        gameConstants={gameConstants}
                        mawashiColor={isSelf ? mawashiColor : '#7d26b4'}
                    ></Player>
                );
            })}

            <FollowCamera target={target} heading={heading} />
            <OrbitControls
                enablePan={false}
                enableZoom={false}
                enableRotate={false}
            />
        </>
    );
}
