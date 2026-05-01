const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001/api";
const MOCK_API_BASE = process.env.NEXT_PUBLIC_MOCK_API_URL ?? "http://localhost:4000";

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

// TODO: バックエンドの認証API完成後、この分岐を消して const url = `${API_BASE}${path}`; に統一する
  const isRealApi = path.startsWith("/friends");
  const baseUrl = isRealApi ? API_BASE : MOCK_API_BASE;
  
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const url = `${cleanBaseUrl}${path}`;
  const res = await fetch(url, { ...options, headers });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`API Error (${url}): Invalid response format.`);
  }

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

// ── Friend endpoints (require token) ──────────────────────────────────────

// フレンドリスト取得
export async function apiGetFriends(userId: string): Promise<any[]> {
  return apiFetch<any[]>(`/friends?userId=${userId}`);
}

// 自分宛ての申請一覧取得
export async function apiGetFriendRequests(userId: string): Promise<any[]> {
  return apiFetch<any[]>(`/friends/requests?userId=${userId}`);
}

// フレンド申請を送信
export async function apiSendFriendRequest(senderId: string, receiverId: string) {
  return apiFetch("/friends/requests", {
    method: "POST",
    body: JSON.stringify({ senderId, receiverId }),
  });
}

// 申請を承諾
export async function apiAcceptFriendRequest(requestId: string, userId: string) {
  return apiFetch(`/friends/requests/${requestId}/accept`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// 申請を拒否
export async function apiRejectFriendRequest(requestId: string, userId: string) {
  return apiFetch(`/friends/requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}

// フレンド削除
export async function apiRemoveFriend(friendId: string, userId: string) {
  return apiFetch(`/friends/${friendId}/remove`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
}
