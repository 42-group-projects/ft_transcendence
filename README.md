_This project has been created as part of the 42 curriculum by nateshim, yuotsubo, mkakizak, yutsasak._

# SumoVerse

A 3D real-time sumo wrestling web application where players control a wrestler (rikishi) on a circular ring (dohyo) and win by pushing the opponent out of bounds. Built as the final project of the 42 Common Core (ft_transcendence).

## Team Information

| Member   | Role(s)                     | Responsibilities                                                                                                                     |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| yuotsubo | Product Owner / Developer   | Product vision, feature prioritization, API server setup, DB connection, ranking/stats API, backend refactoring                      |
| nateshim | Project Manager / Developer | Requirements specification, domain/DB/API design, game customization, friend nickname lookup, bug fixes                              |
| mkakizak | Tech Lead / Developer       | System architecture, Docker/infra setup, 3D game core, Socket.io server, AI opponent, frontend skeleton, auth, real-time multiplayer |
| yutsasak | Developer                   | Friend system API (repository/service/route), CI/CD (linter, formatter), Socket.io frontend integration                              |

## Description

SumoVerse is a browser-based 3D real-time multiplayer fighting game inspired by sumo wrestling. Players control a rikishi on a dohyo and attempt to push their opponent out of the ring.

### Key Features

- **3D Graphics** rendered in the browser using Three.js with physics powered by Rapier
- **Real-time Multiplayer** via WebSocket (Socket.io) with server-side game logic
- **Multiple Matchmaking Modes**: keyword matching, friend invite, random matchmaking, and CPU battle
- **AI Opponents** with 4 difficulty levels (Easy, Medium, Hard, Oni)
- **User Authentication** with email/password (bcrypt hashed)
- **Player Profiles** with avatar, stats, and match history
- **Friend System** with friend requests and friend list
- **Ranking System** (Banzuke) based on player rating
- **Match History & Career Stats** with win/loss records
- **Game Customization** (mawashi color, dohyo theme)
- **Privacy Policy & Terms of Service** pages

## Instructions

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Git
- No need to install Node.js or pnpm locally -- everything runs inside containers

### Setup & Running

1. Clone the repository:

    ```bash
    git clone <repository-url>
    cd ft_transcendence
    ```

2. Create a `.env` file from the example:

    ```bash
    cp .env.example .env
    ```

3. Configure the `.env` file with your settings:

    ```env
    POSTGRES_DB=sumoverse
    POSTGRES_USER=sumoverse
    POSTGRES_PASSWORD=<your-secure-password>

    NODE_ENV=production
    NEXT_PUBLIC_SOCKET_PORT=4000
    SOCKET_PORT=4000
    API_PORT=4001
    NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
    NEXT_PUBLIC_API_URL=http://localhost:4001/api
    JWT_SECRET=<your-jwt-secret>
    INTERNAL_SECRET=<your-internal-secret>
    RECONNECT_GRACE_MS=30000
    ```

4. Build and start all services with a single command:

    ```bash
    docker compose up --build
    ```

5. Open your browser and navigate to `http://localhost:3000`

### Services

| Service                   | Port | Description                      |
| ------------------------- | ---- | -------------------------------- |
| Frontend (Next.js)        | 3000 | Web application UI               |
| API Server (Hono)         | 4001 | REST API                         |
| Socket Server (Socket.io) | 4000 | Real-time game communication     |
| PostgreSQL                | 5432 | Database (internal, not exposed) |

### Stopping

```bash
# Graceful shutdown (keeps data)
docker compose down

# Also remove database volumes
docker compose down -v
```

### Rebuilding after changes

Source files are mounted as volumes, so most changes hot-reload automatically. If you change `package.json` or a `Dockerfile`, rebuild with:

```bash
docker compose up --build
```

## Technical Stack

| Layer           | Technology                              | Justification                                                                                |
| --------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Frontend        | **Next.js 16** (React 19)               | Large ecosystem, App Router for file-based routing, team familiarity with React              |
| 3D Rendering    | **Three.js** via **@react-three/fiber** | Declarative 3D within React component model, performant WebGL rendering                      |
| Physics         | **@react-three/rapier**                 | Wasm-based physics engine, high performance for real-time collision detection                |
| Styling         | **Tailwind CSS 4**                      | Utility-first approach for rapid UI development, consistent design without custom CSS        |
| Backend API     | **Hono**                                | Lightweight TypeScript-first framework, team experience with similar Node.js backends        |
| ORM             | **Drizzle ORM**                         | Type-safe SQL-like syntax, built-in migration support via drizzle-kit                        |
| Realtime        | **Socket.io** (separate container)      | Reliable WebSocket with auto-reconnect and fallback, discussed extensively within team       |
| Database        | **PostgreSQL 16**                       | Robust relational database with strong integrity constraints, well-suited for game/user data |
| Auth            | **JWT** + **bcryptjs**                  | Stateless authentication, secure password hashing with salt                                  |
| Validation      | **Zod**                                 | Runtime type validation shared between API routes and frontend                               |
| Infra           | **Docker Compose**                      | Single-command deployment for evaluation                                                     |
| Package Manager | **pnpm**                                | Fast installs, disk-efficient with content-addressable storage                               |

## Database Schema

### Tables

```
users
  id              UUID (PK)
  email           VARCHAR(255), UNIQUE
  password_hash   VARCHAR(255), nullable
  nickname        VARCHAR(20), UNIQUE, CHECK(1-20 chars)
  avatar_url      TEXT, nullable
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

oauth_accounts
  id                UUID (PK)
  user_id           FK -> users.id (CASCADE)
  provider          ENUM(google, github)
  provider_user_id  VARCHAR(255)
  UNIQUE(provider, provider_user_id)

friend_requests
  id            UUID (PK)
  sender_id     FK -> users.id (CASCADE)
  receiver_id   FK -> users.id (CASCADE)
  status        ENUM(pending, accepted, rejected)
  UNIQUE(sender_id, receiver_id), CHECK(sender != receiver)

friendships
  id          UUID (PK)
  user_id     FK -> users.id (CASCADE)
  friend_id   FK -> users.id (CASCADE)
  status      ENUM(accepted, removed)
  UNIQUE(user_id, friend_id), CHECK(user != friend)

game_rooms
  id          UUID (PK)
  match_type  ENUM(keyword, invite, random, cpu)
  keyword     VARCHAR(50), nullable (required if match_type = keyword)
  host_id     FK -> users.id
  guest_id    FK -> users.id, nullable
  cpu_level   ENUM(easy, medium, hard, oni), nullable (required if match_type = cpu)
  status      ENUM(waiting, ready, playing, finished, cancelled)

game_sessions
  id          UUID (PK)
  room_id     FK -> game_rooms.id (UNIQUE)
  player1_id  FK -> users.id
  player2_id  FK -> users.id, nullable
  is_cpu_game BOOLEAN
  cpu_level   ENUM, nullable
  winner_id   FK -> users.id, nullable
  status      ENUM(playing, paused, finished)

match_records
  id          UUID (PK)
  session_id  FK -> game_sessions.id (UNIQUE)
  player1_id  FK -> users.id
  player2_id  FK -> users.id, nullable
  winner_id   FK -> users.id
  is_cpu_game BOOLEAN
  played_at   TIMESTAMPTZ

user_stats
  user_id   UUID (PK, FK -> users.id, CASCADE)
  wins      INTEGER (>= 0)
  losses    INTEGER (>= 0)
  rating    INTEGER (>= 0, default 1000)
```

### Entity Relationships

```
users 1──N oauth_accounts
users 1──N friend_requests  (as sender / receiver)
users 1──N friendships      (as user / friend)
users 1──N game_rooms       (as host / guest)
users 1──N game_sessions    (as player1 / player2 / winner)
users 1──1 user_stats
game_rooms    1──1 game_sessions
game_sessions 1──1 match_records
```

## Features List

| Feature                   | Description                                                                 | Member(s)          |
| ------------------------- | --------------------------------------------------------------------------- | ------------------ |
| User Registration & Login | Email/password signup and login with JWT authentication                     | mkakizak           |
| User Profile              | View and edit nickname, avatar                                              | mkakizak, yuotsubo |
| Friend System             | Send, accept, and reject friend requests; view friend list; nickname lookup | yutsasak, nateshim |
| Online Status             | Real-time presence tracking (online/in-game/offline)                        | mkakizak           |
| Lobby                     | Home screen after login with matchmaking options                            | mkakizak           |
| Keyword / Random Matching | Match with a specific player using a shared keyword or random matchmaking   | mkakizak           |
| CPU Battle                | Play against AI with 4 difficulty levels (Easy / Medium / Hard / Oni)       | mkakizak           |
| 3D Sumo Game              | Real-time 3D sumo wrestling with physics simulation                         | mkakizak           |
| Game Customization        | Mawashi color and dohyo theme selector                                      | nateshim           |
| Match History (Career)    | View past match results and statistics                                      | yuotsubo, mkakizak |
| Ranking (Banzuke)         | Player leaderboard based on rating                                          | yuotsubo           |
| Admin Dashboard           | Database viewer for administrators                                          | yuotsubo           |
| Privacy Policy            | Legal compliance page accessible from the application                       | mkakizak           |
| Terms of Service          | Legal compliance page accessible from the application                       | mkakizak           |

## Modules

<!-- Major = 2pts, Minor = 1pt. Minimum 14 points required. -->

| #   | Category  | Module                                   | Type  | Pts    | Implementation                                                                         | Member(s)                    |
| --- | --------- | ---------------------------------------- | ----- | ------ | -------------------------------------------------------------------------------------- | ---------------------------- |
| 1   | Web       | Use a Framework (FE: Next.js + BE: Hono) | Major | 2      | Next.js 16 (React 19) for frontend, Hono for backend REST API                          | mkakizak, yuotsubo           |
| 2   | Web       | Real-time features (WebSocket)           | Major | 2      | Socket.io server in separate container; real-time game state sync, presence management | mkakizak                     |
| 3   | Web       | Use an ORM                               | Minor | 1      | Drizzle ORM with PostgreSQL, type-safe schema, migrations via drizzle-kit              | yuotsubo, mkakizak           |
| 4   | User Mgmt | Standard User Management                 | Major | 2      | Profile page, friend system (request/accept/reject), online status tracking, avatar    | yutsasak, mkakizak, nateshim |
| 5   | User Mgmt | Game Statistics & Match History          | Minor | 1      | Career page with win/loss/rating, match history, leaderboard (Banzuke)                 | yuotsubo, mkakizak           |
| 6   | AI        | AI Opponent                              | Major | 2      | 4 difficulty levels (Easy/Medium/Hard/Oni) with prediction-based steering              | mkakizak                     |
| 7   | Gaming    | Implement a complete web-based game      | Major | 2      | 3D sumo wrestling — push opponent out of dohyo to win                                  | mkakizak                     |
| 8   | Gaming    | Remote players                           | Major | 2      | Two players on separate computers play in real-time via Socket.io with reconnection    | mkakizak                     |
| 9   | Gaming    | Advanced 3D graphics (Three.js)          | Major | 2      | Three.js via React Three Fiber + Rapier physics                                        | mkakizak                     |
| 10  | Gaming    | Game customization                       | Minor | 1      | Mawashi color picker, dohyo theme selector                                             | nateshim                     |
|     |           | **Total**                                |       | **17** |                                                                                        |                              |

## Individual Contributions

### yuotsubo

- **Role**: Product Owner / Developer
- **Contributions**:
    - Set up API server service and Docker integration
    - Implemented DB connection and DB viewer (admin dashboard)
    - Built ranking and user stats API endpoints with database triggers
    - Implemented match history API and profile page integration
    - Backend refactoring and layered architecture improvements
- **Challenges**: Designing ranking queries with CTEs to handle edge cases in stats aggregation

### nateshim

- **Role**: Project Manager / Developer
- **Contributions**:
    - Authored requirements specification document (v0.1)
    - Designed database schema and API specification
    - Implemented game customization (mawashi color, dohyo theme)
    - Added friend lookup by nickname (#53)
    - Fixed match history bug for CPU games
- **Challenges**: Translating high-level requirements into concrete database and API designs that the team could implement against

### mkakizak

- **Role**: Tech Lead / Developer
- **Contributions**:
    - Set up Docker Compose infrastructure and PostgreSQL container
    - Built 3D game core (Three.js + physics, win/loss conditions, camera, movement)
    - Implemented Socket.io server with 60 Hz server-side game loop
    - Developed AI opponent system with 4 difficulty levels
    - Built JWT authentication, middleware, and mock API server
    - Implemented real-time multiplayer with reconnection handling
    - Created frontend skeleton, lobby, and matchmaking UI
    - Implemented online presence tracking system
    - Created privacy policy and terms of service pages
- **Challenges**: Synchronizing game state between server-side physics and client-side 3D rendering across network latency

### yutsasak

- **Role**: Developer
- **Contributions**:
    - Built friend system API (repository, service, route layers)
    - Implemented bidirectional friendship creation with rollback
    - Set up CI/CD pipeline (linter, formatter configuration)
    - Integrated Socket.io client in frontend
    - Added input validation and error handling across API
- **Challenges**: Ensuring data consistency for bidirectional friendships with proper transaction rollback

## Project Management

- **Task Distribution**: GitHub Issues with labels (must/should/could) and assignees
- **Meetings**: Bi-weekly sync meetings on Discord
- **Tools**: GitHub Issues, GitHub Pull Requests for code review
- **Communication**: Discord server for daily communication and quick discussions

## Resources

### Documentation & References

- [Next.js Documentation](https://nextjs.org/docs)
- [Three.js Documentation](https://threejs.org/docs)
- [React Three Fiber](https://r3f.docs.pmnd.rs/)
- [Hono Documentation](https://hono.dev/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Socket.io Documentation](https://socket.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### AI Usage

AI tools (GitHub Copilot, Claude) were used as assistants in the following areas:

- **Code assistance**: Boilerplate generation, suggesting implementations for API endpoints and database queries
- **Debugging**: Troubleshooting Socket.io connection issues, Docker networking configuration, and match history bugs
- **Documentation**: Drafting README structure, requirements specification review
- **Design review**: Reviewing database schema design and API endpoint structure for consistency

All AI-generated code and content was reviewed, understood, tested, and validated by team members before integration. Core architectural decisions and game logic were designed and implemented by the team.

## File Structure

```
ft_transcendence/
├── docker-compose.yml        # Orchestrates all services
├── .env.example              # Environment variable template
├── README.md                 # This file
├── CLAUDE.md                 # AI assistant instructions
├── docs/                     # Design documents
│
├── frontend/                 # Next.js web client
│   ├── Dockerfile
│   ├── package.json
│   ├── app/                  # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Landing page
│   │   ├── login/            # Login page
│   │   ├── signup/           # Registration page
│   │   ├── lobby/            # Game lobby
│   │   ├── game/             # Game pages (solo, multiplayer)
│   │   ├── profile/          # User profile
│   │   ├── career/           # Match history
│   │   ├── ranking/          # Banzuke (leaderboard)
│   │   ├── admin/            # Admin dashboard
│   │   ├── privacy/          # Privacy Policy
│   │   └── terms/            # Terms of Service
│   └── lib/                  # Shared utilities
│
├── api_server/               # Hono REST API server
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.ts          # Server entrypoint
│       ├── db/schema.ts      # Drizzle ORM schema
│       ├── routes/           # API route handlers
│       ├── service/          # Business logic
│       ├── repository/       # Database access layer
│       ├── middleware/       # Auth middleware
│       └── utils/            # Utilities
│
├── socket_server/            # Socket.io game server
│   ├── Dockerfile
│   ├── package.json
│   └── index.js              # Express + Socket.io + physics loop
│
└── database/                 # PostgreSQL container
    └── Dockerfile
```
