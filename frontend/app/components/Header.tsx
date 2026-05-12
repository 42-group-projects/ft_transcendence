'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearToken, getToken } from '@/lib/api';

const navLinks = [
    { href: '/login', label: 'Login' },
    { href: '/signup', label: 'Sign up' },
];

// TODO: add pop up to ask if you want to sign up if login fail.

function isActive(pathname: string, href: string) {
    if (href === '/') {
        return pathname === '/';
    }

    return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const syncAuthState = () => {
            setIsLoggedIn(Boolean(getToken()));
        };

        syncAuthState();
        window.addEventListener('auth-changed', syncAuthState);

        return () => {
            window.removeEventListener('auth-changed', syncAuthState);
        };
    }, []);

    const handleLogout = () => {
        clearToken();
        setIsLoggedIn(false);
        router.push('/');
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link
                    href="/"
                    className="text-lg font-semibold tracking-tight text-neutral-100 transition hover:text-white"
                >
                    SumoVerse
                </Link>

                <nav className="flex items-center gap-2 sm:gap-3">
                    {isLoggedIn ? (
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-900 hover:text-white"
                        >
                            Log out
                        </button>
                    ) : (
                        navLinks.map((link) => {
                            const active = isActive(pathname, link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={[
                                        'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-neutral-800 text-white'
                                            : 'text-neutral-300 hover:bg-neutral-900 hover:text-white',
                                    ].join(' ')}
                                >
                                    {link.label}
                                </Link>
                            );
                        })
                    )}
                </nav>
            </div>
        </header>
    );
}
