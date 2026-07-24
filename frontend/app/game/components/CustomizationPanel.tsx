'use client';

import {
    MAWASHI_COLORS,
    DOHYO_THEMES,
    type DohyoTheme,
} from '../hooks/useCustomization';

type CustomizationPanelProps = {
    mawashiColor: string;
    dohyoTheme: DohyoTheme;
    onUpdate: (patch: {
        mawashiColor?: string;
        dohyoTheme?: DohyoTheme;
    }) => void;
};

export function CustomizationPanel({
    mawashiColor,
    dohyoTheme,
    onUpdate,
}: CustomizationPanelProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 border-2 border-neutral-600 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-700">
                    Mawashi
                </span>
                <div className="flex gap-1.5">
                    {MAWASHI_COLORS.map((c) => (
                        <button
                            key={c.value}
                            title={c.label}
                            onClick={() => onUpdate({ mawashiColor: c.value })}
                            className={`h-6 w-6 border-2 transition ${
                                mawashiColor === c.value
                                    ? 'border-stone-900 scale-110'
                                    : 'border-neutral-600 hover:border-stone-700'
                            }`}
                            style={{ backgroundColor: c.value }}
                        />
                    ))}
                </div>
            </div>

            <div className="h-5 w-px bg-neutral-600" />

            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-700">
                    Dohyo
                </span>
                <div className="flex gap-1.5">
                    {(
                        Object.entries(DOHYO_THEMES) as [
                            DohyoTheme,
                            (typeof DOHYO_THEMES)[DohyoTheme],
                        ][]
                    ).map(([key, theme]) => (
                        <button
                            key={key}
                            title={theme.label}
                            onClick={() => onUpdate({ dohyoTheme: key })}
                            className={`h-6 w-6 rounded border-2 transition ${
                                dohyoTheme === key
                                    ? 'border-stone-900 scale-110'
                                    : 'border-neutral-600 hover:border-stone-700'
                            }`}
                            style={{ backgroundColor: theme.surface }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
