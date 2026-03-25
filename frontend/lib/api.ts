const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── Types (mirrors the mock store / schema) ────────────────────────────────

export type User = {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UserStats = {
  user_id: string;
  wins: number;
  losses: number;
  rating: number;
};

export type AuthResponse = {
  access_token: string;
  user: User;
};

export type ApiError = {
  error: string;
};

// ── Token helpers (localStorage) ──────────────────────────────────────────

const TOKEN_KEY = "access_token";
const AUTH_CHANGED_EVENT = "auth-changed";

export function saveToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; samesite=lax`;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

// ── Low-level fetch wrapper ────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error((data as ApiError).error ?? "Unknown API error");
  }

  return data as T;
}

// ── Auth endpoints ─────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiSignup(
  email: string,
  nickname: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, nickname, password }),
  });
}

// ── User endpoints (require token) ────────────────────────────────────────

export async function apiGetMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>("/users/me");
}

export async function apiGetMyStats(): Promise<{ stats: UserStats }> {
  return apiFetch<{ stats: UserStats }>("/users/me/stats");
}
