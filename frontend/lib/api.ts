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
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; samesite=lax; secure`;
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
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax; secure`;
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
    const res = await fetch(url, { cache: 'no-store', ...options, headers });

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

// フレンド申請を送信 (IDまたはニックネームで自動判定して送信)
export async function apiSendFriendRequest(target: string) {
    const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            target,
        );
    const body = isUuid ? { receiver_id: target } : { nickname: target };
    return apiFetch('/friends/requests', {
        method: 'POST',
        body: JSON.stringify(body),
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

// ユーザー検索
export async function apiSearchUsers(
    nickname: string,
): Promise<{ users: any[] }> {
    return apiFetch<{ users: any[] }>(
        `/users/search?nickname=${encodeURIComponent(nickname)}`,
    );
}

// プロフィール更新 (ニックネーム)
export async function apiUpdateProfile(
    nickname: string,
): Promise<{ user: User }> {
    return apiFetch<{ user: User }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ nickname }),
    });
}

// アバターアップロード (File)
export async function apiUploadAvatar(file: File): Promise<{ user: User }> {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const cleanBaseUrl = API_BASE.replace(/\/$/, '');
    const url = `${cleanBaseUrl}/users/me/avatar`;

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
    });

    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        throw new Error('Invalid response format');
    }

    if (!res.ok) {
        throw new Error(data.error ?? 'Failed to upload avatar');
    }

    return data as { user: User };
}

// アバターURLの解決 (相対パスの場合にAPIベースURLを付与)
export function getAvatarUrl(url: string | null | undefined): string {
    let apiBase = 'http://localhost:4001';
    try {
        apiBase = new URL(API_BASE).origin;
    } catch {
        apiBase = API_BASE.replace(/\/api\/?$/, '');
    }

    if (!url) {
        return `${apiBase}/api/uploads/default-avatar.svg`;
    }
    if (
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('data:')
    ) {
        return url;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
}

// Helper function to translate raw backend error codes to user-friendly English messages
export function getFriendlyErrorMessage(message: string): string {
    const errorMap: Record<string, string> = {
        AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
        AUTH_NICKNAME_EXISTS: 'This nickname is already taken.',
        AUTH_EMAIL_EXISTS: 'This email is already registered.',
        SOCIAL_SELF_REQUEST: 'You cannot add yourself as a friend.',
        SOCIAL_ALREADY_FRIENDS: 'You are already friends with this user.',
        SOCIAL_REQUEST_EXISTS:
            'A friend request is already pending for this user.',
        NOT_FOUND: 'User not found.',
        UNPROCESSABLE: 'Invalid input. Please check the requirements.',
        INTERNAL_ERROR:
            'An internal server error occurred. Please try again later.',
    };
    return errorMap[message] ?? message;
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
