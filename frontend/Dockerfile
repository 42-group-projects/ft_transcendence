FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Source is bind-mounted in dev; this COPY is a fallback for production builds
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]
