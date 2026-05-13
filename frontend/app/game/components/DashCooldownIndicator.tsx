import React from 'react';
import { Html } from '@react-three/drei';

type Props = {
    dashCooldownMs?: number;
    dashCooldownTotalMs?: number;
    offsetY?: number;
};

export default function DashCooldownIndicator({
    dashCooldownMs = 0,
    dashCooldownTotalMs = 800,
    offsetY = 0.9,
}: Props) {
    const pct = Math.max(
        0,
        Math.min(1, 1 - dashCooldownMs / dashCooldownTotalMs),
    );
    const label =
        dashCooldownMs > 0 ? `${(dashCooldownMs / 1000).toFixed(1)}s` : 'Ready';

    return (
        <Html
            position={[0, offsetY, 0]}
            style={{ pointerEvents: 'none' }}
            center
        >
            <div className="text-xs text-white bg-black/40 px-2 py-1 rounded font-mono select-none">
                <div className="mt-1 flex items-center gap-2">
                    <div className="w-20 h-3 bg-white/10 rounded overflow-hidden">
                        <div
                            className="h-3 bg-emerald-400"
                            style={{ width: `${pct * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </Html>
    );
}
