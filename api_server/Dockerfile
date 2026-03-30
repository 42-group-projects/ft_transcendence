FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

# Source is bind-mounted in dev; this COPY is a fallback for production builds
COPY . .

EXPOSE 4001

CMD ["node", "--watch", "src/index.js"]
