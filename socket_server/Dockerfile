FROM node:22-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json ./
RUN npm install

# Source is bind-moupnted in dev; this COPY is a fallback for production builds
COPY . .

EXPOSE 3001

# node --watch is built-in hot-reload (Node 18+), no extra deps needed
CMD ["node", "--watch", "index.js"]
