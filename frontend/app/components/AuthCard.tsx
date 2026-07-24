import type { ReactNode } from 'react';

type AuthCardProps = {
    accentLabel: string;
    accentColorClassName: string;
    title: string;
    description: string;
    children: ReactNode;
    footer: ReactNode;
};

export function AuthCard({
    accentLabel,
    accentColorClassName,
    title,
    description,
    children,
    footer,
}: AuthCardProps) {
    return (
        <div className=" border border-neutral-800 bg-yellow-100/90 p-8 shadow-2xl shadow-black/30">
            <div className="mb-8 text-center">
                <p
                    className={`text-sm uppercase tracking-[0.3em] ${accentColorClassName}`}
                >
                    {accentLabel}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    {title}
                </h1>
                <p className="mt-3 text-sm text-neutral-400">{description}</p>
            </div>

            {children}

            <div className="mt-6 flex items-center justify-between text-sm text-neutral-400">
                {footer}
            </div>
        </div>
    );
}
