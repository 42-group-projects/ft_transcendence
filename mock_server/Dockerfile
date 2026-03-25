FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

EXPOSE 4000

CMD ["node", "--watch", "index.js"]
