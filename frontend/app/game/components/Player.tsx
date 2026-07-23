import { useMemo } from 'react';
import * as THREE from 'three';
import type { GameConstants, PlayerState } from '../types';
import { PLAYER_RADIUS as IMPORTED_PLAYER_RADIUS } from '../constants';

// ─── Mawashi ──────────────────────────────────────────────────────────────────

type MawashiProps = {
    radius: number;
    color: string;
};

function Mawashi({ radius, color }: MawashiProps) {
    const beltRadius = radius * 1.02;
    const beltThickness = radius * 0.08;
    const beltWidthScale = 1.8;
    const strapCurve = useMemo(() => {
        const strapRadius = radius * 1.05;
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= 24; i++) {
            const angle = (Math.PI * i) / 24;
            points.push(
                new THREE.Vector3(
                    0,
                    -Math.sin(angle) * strapRadius,
                    Math.cos(angle) * strapRadius,
                ),
            );
        }
        return new THREE.CatmullRomCurve3(points);
    }, [radius]);

    const material = (
        <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} />
    );

    return (
        <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, beltWidthScale]}>
                <torusGeometry args={[beltRadius, beltThickness, 12, 48]} />
                {material}
            </mesh>
            <mesh>
                <tubeGeometry
                    args={[strapCurve, 32, beltThickness * 0.75, 10, false]}
                    scale={[1, 1, beltWidthScale]}
                />
                {material}
            </mesh>
            <mesh position={[0, radius * 0.1, beltRadius]}>
                <boxGeometry args={[beltThickness * 4, 0.4, 0.3]} />
                {material}
            </mesh>
        </group>
    );
}

// ─── Player ───────────────────────────────────────────────────────────────────

type PlayerProps = {
    player: PlayerState;
    gameConstants?: GameConstants | null;
    mawashiColor?: string;
};

export function Player({
    player,
    gameConstants,
    mawashiColor = '#3b82f6',
}: PlayerProps) {
    const radius = gameConstants?.PLAYER_RADIUS ?? IMPORTED_PLAYER_RADIUS;
    return (
        <group
            position={[player.position.x, player.position.y, player.position.z]}
            rotation={[0, -(player.heading ?? 0), 0]}
        >
            <mesh castShadow>
                <sphereGeometry args={[radius, 24, 24]} />
                <meshStandardMaterial color="#f5d5a0" />
            </mesh>

            <Mawashi radius={radius} color={mawashiColor} />
        </group>
    );
}
