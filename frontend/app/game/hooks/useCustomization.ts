"use client";

import { useState, useEffect, useCallback } from "react";

export type DohyoTheme = "default" | "sand" | "night" | "clay";

export type CustomizationState = {
  mawashiColor: string;
  dohyoTheme: DohyoTheme;
};

const STORAGE_KEY = "sumoverse-customization";

const DEFAULT_STATE: CustomizationState = {
  mawashiColor: "#3b82f6",
  dohyoTheme: "default",
};

export const MAWASHI_COLORS = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Gold" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f5f5f5", label: "White" },
  { value: "#171717", label: "Black" },
];

export const DOHYO_THEMES: Record<DohyoTheme, { label: string; surface: string; border: string }> = {
  default: { label: "Default", surface: "#2f2f2f", border: "#f5f5f5" },
  sand:    { label: "Sand",    surface: "#c2a97e", border: "#8b7355" },
  night:   { label: "Night",   surface: "#1a1a2e", border: "#4a4a8a" },
  clay:    { label: "Clay",    surface: "#8b4513", border: "#d2b48c" },
};

function loadFromStorage(): CustomizationState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useCustomization() {
  const [state, setState] = useState<CustomizationState>(DEFAULT_STATE);

  useEffect(() => {
    setState(loadFromStorage());
  }, []);

  const update = useCallback((patch: Partial<CustomizationState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { ...state, update };
}
