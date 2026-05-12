FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10.32.1 && pnpm install --frozen-lockfile

# Source is bind-mounted in dev; this COPY is a fallback for production builds
COPY . .

EXPOSE 4001

CMD ["pnpm", "run", "dev:compose"]
