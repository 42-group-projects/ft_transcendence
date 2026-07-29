'use client';

import {
    MAWASHI_COLORS,
    DOHYO_THEMES,
    ENVIRONMENTS,
    type DohyoTheme,
    type EnvironmentType,
} from '../hooks/useCustomization';

type CustomizationPanelProps = {
    mawashiColor: string;
    dohyoTheme: DohyoTheme;
    environment: EnvironmentType;
    onUpdate: (patch: {
        mawashiColor?: string;
        dohyoTheme?: DohyoTheme;
        environment?: EnvironmentType;
    }) => void;
};

export function CustomizationPanel({
    mawashiColor,
    dohyoTheme,
    environment,
    onUpdate,
}: CustomizationPanelProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 border-2 border-neutral-600 bg-amber-50 px-4 py-3 bg-yellow-100">
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

            <div className="h-5 w-px bg-neutral-600" />

            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-stone-700">
                    Environment
                </span>
                <select
                    value={environment}
                    onChange={(e) =>
                        onUpdate({
                            environment: e.target.value as EnvironmentType,
                        })
                    }
                    onKeyDown={(e) => e.preventDefault()}
                    className="rounded border-2 border-neutral-600 bg-white px-2 py-1 text-xs text-stone-700 transition hover:border-stone-700"
                >
                    {(
                        Object.entries(ENVIRONMENTS) as [
                            EnvironmentType,
                            (typeof ENVIRONMENTS)[EnvironmentType],
                        ][]
                    ).map(([key, env]) => (
                        <option key={key} value={key}>
                            {env.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
