import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import FrameRateTracker from './components/FrameRateTracker';

export function FpsCounter({ setFps }) {
    const lastTime = useRef(performance.now());
    const frames = useRef(0);

    useFrame(() => {
        frames.current++;
        const now = performance.now();
        if (now - lastTime.current >= 1000) {
            setFps(frames.current);
            frames.current = 0;
            lastTime.current = now;
        }
    });
    return null;
}
