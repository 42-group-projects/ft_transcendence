import { useEffect, useRef, useState } from 'react';

export function useDashCooldown(dashCooldownTotalMs: number = 800) {
    const [dashCooldownMs, setDashCooldownMs] = useState(0);
    const cooldownRef = useRef<NodeJS.Timeout | null>(null);

    // Call this when dash is triggered
    const triggerDash = () => {
        setDashCooldownMs(dashCooldownTotalMs);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setDashCooldownMs((prev) => {
                if (prev <= 0) {
                    if (cooldownRef.current) clearInterval(cooldownRef.current);
                    return 0;
                }
                return prev - 16; // ~60fps
            });
        }, 16);
    };

    useEffect(() => {
        return () => {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
        };
    }, []);

    return { dashCooldownMs, triggerDash };
}
