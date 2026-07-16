const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

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

export type MatchRecord = {
    id: string;
    session_id: string;
    player1_id: string;
    player1_nickname: string;
    player2_id: string | null;
    player2_nickname: string | null;
    winner_id: string;
    is_cpu_game: boolean;
    played_at: string;
};

export type RankingEntry = {
    rank: number;
    id: string;
    nickname: string;
    avatar_url: string | null;
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

const TOKEN_KEY = 'access_token';
const AUTH_CHANGED_EVENT = 'auth-changed';

export function saveToken(token: string) {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; samesite=lax`;
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
    if (typeof window === 'undefined') {
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
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = API_BASE;

    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
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
        const message = (data as ApiError).error ?? 'Unknown API error';
        console.error(`[apiFetch] ${res.status} ${res.url}:`, message, data);
        throw new Error(message);
    }

    return data as T;
}

// ── Auth endpoints ─────────────────────────────────────────────────────────

export async function apiLogin(
    email: string,
    password: string,
): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function apiLogout(): Promise<void> {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    clearToken();
}

export async function apiSignup(
    email: string,
    nickname: string,
    password: string,
): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, nickname, password }),
    });
}

// ── User endpoints (require token) ────────────────────────────────────────

export async function apiGetMe(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>('/users/me');
}

export async function apiGetMyStats(): Promise<{ stats: UserStats }> {
    return apiFetch<{ stats: UserStats }>('/users/me/stats');
}

// ── Friend endpoints (require token) ──────────────────────────────────────

// フレンドリスト取得 (認証済みユーザーのリストを返す — userId は JWTから取得)
export async function apiGetFriends(): Promise<any[]> {
    return apiFetch<any[]>('/friends');
}

// 自分宛ての申請一覧取得
export async function apiGetFriendRequests(): Promise<any[]> {
    return apiFetch<any[]>('/friends/requests');
}

// フレンド申請を送信 (senderId は JWT から取得 — ニックネームで検索)
export async function apiSendFriendRequest(nickname: string) {
    return apiFetch('/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ nickname }),
    });
}

// 申請を承諾
export async function apiAcceptFriendRequest(requestId: string) {
    return apiFetch(`/friends/requests/${requestId}/accept`, {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

// 申請を拒否
export async function apiRejectFriendRequest(requestId: string) {
    return apiFetch(`/friends/requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

// フレンド削除
export async function apiRemoveFriend(friendId: string) {
    return apiFetch(`/friends/${friendId}/remove`, {
        method: 'POST',
        body: JSON.stringify({}),
    });
}

// ── Match history / ranking endpoints ────────────────────────────────────

export async function apiGetMyMatches(
    limit = 20,
): Promise<{ matches: MatchRecord[] }> {
    return apiFetch<{ matches: MatchRecord[] }>(
        `/users/me/matches?limit=${limit}`,
    );
}

export async function apiGetUserMatches(
    userId: string,
    limit = 20,
): Promise<{ matches: MatchRecord[] }> {
    return apiFetch<{ matches: MatchRecord[] }>(
        `/users/${userId}/matches?limit=${limit}`,
    );
}

export async function apiGetRanking(
    limit = 50,
): Promise<{ ranking: RankingEntry[] }> {
    return apiFetch<{ ranking: RankingEntry[] }>(
        `/users/ranking?limit=${limit}`,
    );
}

export async function apiGetUserStats(
    userId: string,
): Promise<{ data: UserStats & { win_rate: number } }> {
    return apiFetch<{ data: UserStats & { win_rate: number } }>(
        `/users/${userId}/stats`,
    );
}
