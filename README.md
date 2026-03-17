# ft_transcendence


## File Structure

```
ft_transcendence/
├── docker-compose.yml        # Orchestrates all services
├── .gitignore
│
├── frontend/                 # Next.js web client
│   ├── Dockerfile
│   ├── package.json
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   └── public/               # Static assets
│
├── database/                 # PostgreSQL container setup
│   └── Dockerfile
│
└── socket_server/            # Node.js game server
    ├── Dockerfile
    ├── package.json
    └── index.js              # Express + Socket.io + physics loop
    
```

---

## Technologies

| Layer | Technology |
|---|---|
| Frontend framework | [Next.js 16](https://nextjs.org/) + React 19 |
| 3D rendering | [Three.js](https://threejs.org/) via [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) |
| Physics (client) | [React Three Rapier](https://github.com/pmndrs/react-three-rapier) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Real-time comms | [Socket.io](https://socket.io/) (client + server) |
| Game server | Node.js + Express |
| Containerisation | Docker + Docker Compose |
| Package manager | [pnpm](https://pnpm.io/) |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- No need to install Node.js or pnpm locally — everything runs inside containers

### Environment variables

Create a `.env` file in the project root with:

```env
POSTGRES_DB=*****
POSTGRES_USER=*****
POSTGRES_PASSWORD=******

NODE_ENV=******
SOCKET_PORT=*****

NEXT_PUBLIC_SOCKET_URL=******
```

### Running the project

```bash
# Clone the repo
git clone git@github.com:42-group-projects/ft_transcendence.git
cd ft_transcendence

# Build and start all services
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Socket server | http://localhost:3001 |

### Stopping the project

```bash
# Graceful shutdown (keeps volumes)
docker compose down

# Also remove volumes
docker compose down -v
```

### Rebuilding after changes

Source files are mounted as volumes, so most changes hot-reload automatically. If you change `package.json` or a `Dockerfile`, rebuild with:

```bash
docker compose up --build
```

