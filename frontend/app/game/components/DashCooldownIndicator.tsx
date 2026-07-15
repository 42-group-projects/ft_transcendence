import { ClippingGroup } from 'three/webgpu';

type Props = {
    dashCooldownMs?: number;
    dashCooldownTotalMs?: number;
};

export default function DashCooldownIndicator({
    dashCooldownMs = 0,
    dashCooldownTotalMs = 800,
}: Props) {
    const pct = Math.max(
        0,
        Math.min(1, 1 - dashCooldownMs / dashCooldownTotalMs),
    );

    console.log('dashCooldownMs:' + dashCooldownMs);
    console.log('total:' + dashCooldownTotalMs);
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="text-xs text-white bg-black/40 px-2 py-1 rounded font-mono select-none">
                <div className="flex items-center gap-2">
                    <span className="text-neutral-400">Dash</span>
                    <progress
                        value={dashCooldownTotalMs - dashCooldownMs}
                        max={dashCooldownTotalMs}
                    />
                    <span>
                        {dashCooldownMs > 0
                            ? `${(dashCooldownMs / 1000).toFixed(1)}s`
                            : 'Ready'}
                    </span>
                </div>
            </div>
        </div>
    );
}
