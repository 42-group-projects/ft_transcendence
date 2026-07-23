'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';

// Routes to the lobby when authenticated, otherwise sends the user to log in.
// Prevents the landing-page CTA from silently bouncing back to `/` via the
// auth-guard middleware when no token is present.
export function EnterGameButton() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const syncAuthState = () => setIsLoggedIn(Boolean(getToken()));

        syncAuthState();
        window.addEventListener('auth-changed', syncAuthState);
        return () => window.removeEventListener('auth-changed', syncAuthState);
    }, []);

    return (
        <Link
            href={isLoggedIn ? '/lobby' : '/login'}
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
            {isLoggedIn ? 'Enter Game' : 'Log in to Play'}
        </Link>
    );
}
