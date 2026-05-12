# API

## 共通仕様

- **Base URL**: `/api/v1`
- **認証**: `Authorization: Bearer <JWT>`
- **Content-Type**: `application/json`
- **冪等性**: 副作用のある POST/PATCH には `Idempotency-Key: <UUID v4>` ヘッダー必須（有効期間24時間）
- **ページネーション**: カーソルベース `?cursor=...&limit=...`（default: 20, max: 100）

### レスポンス形式

```json
// 成功
{ "data": { ... }, "meta": { "cursor": "...", "has_more": false } }

// エラー
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

### 共通エラーコード

| コード         | HTTP | 説明                       |
| -------------- | ---- | -------------------------- |
| UNAUTHORIZED   | 401  | 認証トークン不正・期限切れ |
| FORBIDDEN      | 403  | 権限なし                   |
| NOT_FOUND      | 404  | リソースが存在しない       |
| CONFLICT       | 409  | 重複・競合                 |
| UNPROCESSABLE  | 422  | バリデーションエラー       |
| INTERNAL_ERROR | 500  | サーバーエラー             |

---

## エンドポイント全体マップ

| Method | Path                            | 説明                     | 認可              |
| ------ | ------------------------------- | ------------------------ | ----------------- |
| POST   | /auth/register                  | ユーザー登録             | Guest             |
| POST   | /auth/login                     | ログイン                 | Guest             |
| POST   | /auth/logout                    | ログアウト               | Player            |
| GET    | /auth/oauth/{provider}          | OAuth 認証開始           | Guest             |
| GET    | /auth/oauth/{provider}/callback | OAuth コールバック       | Guest             |
| GET    | /users/me                       | 自分のプロフィール取得   | Player (owner)    |
| PATCH  | /users/me                       | 自分のプロフィール更新   | Player (owner)    |
| GET    | /users/{id}                     | ユーザープロフィール取得 | Player            |
| POST   | /friends/requests               | フレンドリクエスト送信   | Player            |
| GET    | /friends/requests               | フレンドリクエスト一覧   | Player            |
| POST   | /friends/requests/{id}/accept   | リクエスト承諾           | Player (receiver) |
| POST   | /friends/requests/{id}/reject   | リクエスト拒否           | Player (receiver) |
| GET    | /friends                        | フレンドリスト取得       | Player            |
| POST   | /friends/{id}/remove            | フレンド削除             | Player (当事者)   |
| POST   | /rooms                          | ルーム作成               | Player            |
| GET    | /rooms/{id}                     | ルーム詳細               | Player (参加者)   |
| POST   | /rooms/{id}/join                | ルーム入室               | Player            |
| POST   | /rooms/{id}/ready               | 準備完了                 | Player (参加者)   |
| POST   | /rooms/{id}/cancel              | ルームキャンセル         | Player (参加者)   |
| POST   | /rooms/keyword-match            | あいことばマッチング     | Player            |
| GET    | /games/{id}                     | ゲームセッション詳細     | Player (参加者)   |
| GET    | /rankings                       | 番付ランキング           | Player            |
| GET    | /users/{id}/stats               | ユーザー統計             | Player            |
| GET    | /users/{id}/history             | 対戦履歴                 | Player            |

---

## Identity and Access

### POST /auth/register

ユーザー登録。JWT を返却。

**Request**

```json
{
    "email": "player@example.com", // RFC 5322, max 255
    "password": "SecureP@ss1", // 8文字以上, 英大小数字各1以上
    "nickname": "sumo_fan42" // 1〜20文字, UQ
}
```

**Response** `201 Created`

```json
{
    "access_token": "eyJ...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
        "id": "uuid",
        "email": "...",
        "nickname": "...",
        "avatar_url": null,
        "created_at": "..."
    }
}
```

**Errors**: `409 AUTH_EMAIL_EXISTS`, `409 AUTH_NICKNAME_EXISTS`, `422 UNPROCESSABLE`

---

### POST /auth/login

ログイン。JWT を返却。

**Request**

```json
{ "email": "player@example.com", "password": "SecureP@ss1" }
```

**Response** `200 OK` — register と同形式

**Errors**: `401 AUTH_INVALID_CREDENTIALS`, `422 UNPROCESSABLE`

---

### POST /auth/logout

ログアウト。現在のセッションを無効化。

**Response** `204 No Content`

**Errors**: `401 UNAUTHORIZED`

---

### GET /auth/oauth/{provider}

OAuth 認証開始。プロバイダの認証画面にリダイレクト。

- `provider`: `google` | `github`
- Query: `redirect_uri` (optional)

**Response** `302 Found` → プロバイダ認証画面

**Errors**: `422 UNPROCESSABLE`（未対応 provider）

---

### GET /auth/oauth/{provider}/callback

OAuth コールバック。ユーザー作成/検索して JWT 発行。

- Query: `code`, `state`（プロバイダから付与）

**Response** `302 Found` → フロントエンドにリダイレクト（JWT をクエリパラメータ or Cookie で付与）

**Errors**: `503 AUTH_OAUTH_FAILED`, `422 UNPROCESSABLE`, `409 AUTH_NICKNAME_EXISTS`

---

### GET /users/me

自分のプロフィール取得。

**Response** `200 OK`

```json
{
    "id": "uuid",
    "email": "...",
    "nickname": "...",
    "avatar_url": "...",
    "created_at": "...",
    "updated_at": "...",
    "oauth_providers": ["google"]
}
```

**Errors**: `401 UNAUTHORIZED`

---

### PATCH /users/me

自分のプロフィール更新。少なくとも1フィールド必要。

**Request**

```json
{ "nickname": "yokozuna_master", "avatar_url": "https://..." }
```

- `nickname`: 1〜20文字, UQ (optional)
- `avatar_url`: 有効URL, max 2048文字 (optional)

**Response** `200 OK` — ユーザーオブジェクト

**Errors**: `409 AUTH_NICKNAME_EXISTS`, `422 UNPROCESSABLE`

---

### GET /users/{id}

ユーザー公開プロフィール取得。email, oauth_providers は含まない。

**Response** `200 OK`

```json
{ "id": "uuid", "nickname": "...", "avatar_url": "...", "created_at": "..." }
```

**Errors**: `404 NOT_FOUND`, `422 UNPROCESSABLE`（UUID形式不正）

---

## Social

### POST /friends/requests

フレンドリクエスト送信。

**Request**

```json
{ "receiver_id": "uuid" }
```

**Guard**: 自分自身→`422 SOCIAL_SELF_REQUEST`, 既にフレンド→`409 SOCIAL_ALREADY_FRIENDS`, pending申請あり→`409 SOCIAL_REQUEST_EXISTS`, ユーザー不在→`404 NOT_FOUND`

**Response** `201 Created`

```json
{
    "id": "uuid",
    "sender_id": "uuid",
    "receiver_id": "uuid",
    "status": "pending",
    "created_at": "...",
    "updated_at": "..."
}
```

---

### GET /friends/requests

フレンドリクエスト一覧（pending のみ）。

**Query**: `direction` (`incoming` | `outgoing`, default: both), `cursor`, `limit`

**Response** `200 OK` — data 配列 + meta

---

### POST /friends/requests/{id}/accept

フレンドリクエスト承諾。receiver のみ実行可能。friendships レコードが双方向で作成される。

**Guard**: receiver以外→`403 FORBIDDEN`, 申請不在→`404 NOT_FOUND`, pending以外→`409 CONFLICT`

**Response** `200 OK` — status: "accepted"

---

### POST /friends/requests/{id}/reject

フレンドリクエスト拒否。receiver のみ実行可能。

**Guard**: accept と同様

**Response** `200 OK` — status: "rejected"

---

### GET /friends

フレンドリスト取得（オンラインステータス付き）。

**Query**: `cursor`, `limit`

**Response** `200 OK`

```json
{
    "data": [
        {
            "id": "uuid",
            "user_id": "uuid",
            "friend_id": "uuid",
            "status": "accepted",
            "online_status": "online | in_game | offline",
            "created_at": "...",
            "updated_at": "..."
        }
    ],
    "meta": { "cursor": "...", "has_more": true }
}
```

---

### POST /friends/{id}/remove

フレンド削除。双方の friendship が removed になる。

**Guard**: 不在→`404 NOT_FOUND`, 当事者以外→`403 FORBIDDEN`, 解消済み→`404 SOCIAL_NOT_FRIENDS`

**Response** `200 OK` — status: "removed"

---

## Matchmaking

### POST /rooms

ゲームルーム作成。

**Request**

```json
{
    "match_type": "keyword | invite | random | cpu",
    "keyword": "sumo42", // keyword時のみ必須 (1-32文字, 英数字・ハイフン)
    "guest_id": "uuid", // invite時のみ必須
    "cpu_level": "easy | medium | hard | oni" // cpu時のみ必須
}
```

`match_type=cpu` の場合、status は即座に `playing` へ遷移。

**Response** `201 Created`

```json
{
    "id": "uuid",
    "match_type": "keyword",
    "keyword": "sumo42",
    "host_id": "uuid",
    "guest_id": null,
    "cpu_level": null,
    "status": "waiting",
    "created_at": "...",
    "updated_at": "..."
}
```

**Errors**: `409 MATCH_ALREADY_IN_GAME`, `403 MATCH_NOT_FRIEND`, `409 MATCH_FRIEND_OFFLINE`

---

### GET /rooms/{id}

ルーム詳細取得。参加者のみ閲覧可能。

**Response** `200 OK` — ルームオブジェクト

**Errors**: `404 NOT_FOUND`

---

### POST /rooms/{id}/join

ルーム入室。状態遷移: waiting → ready。

**Response** `200 OK` — guest_id にcaller、status: "ready"

**Errors**: `409 MATCH_ROOM_FULL`, `409 MATCH_ALREADY_IN_GAME`, `409 MATCH_INVALID_TRANSITION`

---

### POST /rooms/{id}/ready

準備完了通知。両プレイヤー ready で ready → playing へ遷移。

**Response** `200 OK` — status: "ready" (片方のみ) or "playing" (両方)

**Errors**: `409 MATCH_INVALID_TRANSITION`

---

### POST /rooms/{id}/cancel

ルームキャンセル。waiting/ready → cancelled。

**Response** `200 OK` — status: "cancelled"

**Errors**: `409 MATCH_INVALID_TRANSITION`（playing/finished/cancelled 時）

---

### POST /rooms/keyword-match

あいことばマッチング。待機中ルームがあれば参加、なければ新規作成。

**Request**

```json
{ "keyword": "sumo42" }
```

**Response** `200 OK`（既存ルーム参加） or `201 Created`（新規作成）

**Errors**: `409 MATCH_ALREADY_IN_GAME`

---

### ルーム状態遷移

```
waiting ── join ──→ ready ── ready(both) ──→ playing ──→ finished
  │                  │
  │ cancel           │ cancel
  ↓                  ↓
cancelled          cancelled
```

---

## Game

### GET /games/{id}

ゲームセッション詳細取得。参加者のみ。

**Response** `200 OK`

```json
{
    "id": "uuid",
    "room_id": "uuid",
    "player1_id": "uuid",
    "player2_id": "uuid | null",
    "is_cpu_game": false,
    "cpu_level": null,
    "winner_id": "uuid | null",
    "status": "playing | paused | finished",
    "started_at": "...",
    "finished_at": "... | null",
    "created_at": "...",
    "updated_at": "..."
}
```

**Errors**: `403 FORBIDDEN`, `404 NOT_FOUND`

---

### WebSocket (Socket.io)

接続: namespace `/game`, auth `{ token: "Bearer <jwt>" }`

#### Client → Server

| Event       | Payload                                                                            | 説明                   |
| ----------- | ---------------------------------------------------------------------------------- | ---------------------- |
| `join`      | `{ "session_id": "uuid" }`                                                         | ゲームセッションに参加 |
| `move`      | `{ "forward": bool, "backward": bool, "left": bool, "right": bool, "push": bool }` | プレイヤー入力送信     |
| `reconnect` | `{ "session_id": "uuid" }`                                                         | 切断後の再接続         |

#### Server → Client

| Event                   | Payload                                                                      | 説明                            |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| `countdown`             | `{ "count": 3 }`                                                             | カウントダウン (3, 2, 1)        |
| `game_state`            | `{ "players": [{ "id", "position", "velocity", "rotation" }], "timestamp" }` | ゲーム状態同期 (~60fps)         |
| `result`                | `{ "winner_id", "player1_id", "player2_id" }`                                | 勝敗結果                        |
| `opponent_disconnected` | (なし)                                                                       | 相手切断 → paused               |
| `opponent_reconnected`  | (なし)                                                                       | 相手再接続 → playing            |
| `session_ended`         | (なし)                                                                       | タイムアウト等で終了 → finished |

#### WebSocket エラー

| Code                    | 説明                               |
| ----------------------- | ---------------------------------- |
| UNAUTHORIZED            | 未認証・参加者でない               |
| NOT_FOUND               | セッション不在                     |
| GAME_INVALID_TRANSITION | 不正な状態遷移（paused中のmove等） |
| GAME_SESSION_ENDED      | セッション終了済み                 |

---

## Stats

### GET /rankings

番付ランキング（rating 降順）。

**Query**: `cursor`, `limit`

**Response** `200 OK`

```json
{
    "data": [
        {
            "user_id": "uuid",
            "nickname": "SumoKing",
            "avatar_url": "...",
            "wins": 42,
            "losses": 8,
            "rating": 1850,
            "rank": 1
        }
    ],
    "meta": { "cursor": "...", "has_more": true }
}
```

同 rating の場合、user_id で安定的にタイブレイク。

---

### GET /users/{id}/stats

ユーザー統計取得。

**Response** `200 OK`

```json
{
    "data": {
        "user_id": "uuid",
        "wins": 42,
        "losses": 8,
        "win_rate": 0.84,
        "rating": 1850,
        "rank": 1
    }
}
```

`win_rate` = wins / (wins + losses)、小数第2位丸め。未対戦時は 0.00。

---

### GET /users/{id}/history

対戦履歴取得（played_at 降順）。

**Query**: `cursor`, `limit`

**Response** `200 OK`

```json
{
    "data": [
        {
            "match_id": "uuid",
            "opponent": {
                "user_id": "uuid",
                "nickname": "...",
                "avatar_url": "..."
            },
            "result": "win | loss",
            "is_cpu_game": false,
            "played_at": "2026-03-18T14:30:00Z"
        }
    ],
    "meta": { "cursor": "...", "has_more": true }
}
```

CPU 対戦時: `opponent.user_id` = null, `opponent.nickname` = "CPU"。

**Errors**: `404 NOT_FOUND`
