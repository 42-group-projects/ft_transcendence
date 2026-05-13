// FrameRateTracker.tsx
import React from 'react';

export const FrameRateDisplay: React.FC<{ fps: number }> = ({ fps }) => (
    <div className="absolute top-2 right-2 text-white bg-black/50 px-2 py-1 rounded font-mono select-none z-50 pointer-events-none">
        FPS: {fps}
    </div>
);
