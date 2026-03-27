import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory store — mirrors the `users` and `user_stats` schema tables.
// Replace this module with real DB calls when the backend is ready.
// ---------------------------------------------------------------------------

const SALT_ROUNDS = 10;

// Seed two players so you can always log in without signing up first.
const users = new Map([
  [
    "a1b2c3d4-0001-0000-0000-000000000001",
    {
      id: "a1b2c3d4-0001-0000-0000-000000000001",
      email: "player1@example.com",
      // bcrypt hash of "password1"
      password_hash: bcrypt.hashSync("password1", SALT_ROUNDS),
      nickname: "sumo_king",
      avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=sumo_king",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  [
    "a1b2c3d4-0002-0000-0000-000000000002",
    {
      id: "a1b2c3d4-0002-0000-0000-000000000002",
      email: "player2@example.com",
      password_hash: bcrypt.hashSync("password2", SALT_ROUNDS),
      nickname: "yokozuna42",
      avatar_url: "https://api.dicebear.com/9.x/shapes/svg?seed=yokozuna42",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
]);

// Mirrors `user_stats` table
const userStats = new Map([
  ["a1b2c3d4-0001-0000-0000-000000000001", { wins: 10, losses: 3, rating: 1200 }],
  ["a1b2c3d4-0002-0000-0000-000000000002", { wins: 5,  losses: 7, rating: 950  }],
]);

// Returns a safe public user object (no password_hash)
function publicUser(user) {
  const { password_hash: _, ...safe } = user;
  return safe;
}

export const store = {
  findByEmail(email) {
    return [...users.values()].find((u) => u.email === email) ?? null;
  },

  findById(id) {
    return users.get(id) ?? null;
  },

  emailTaken(email) {
    return [...users.values()].some((u) => u.email === email);
  },

  nicknameTaken(nickname) {
    return [...users.values()].some((u) => u.nickname === nickname);
  },

  async createUser({ email, nickname, password }) {
    const id = randomUUID();
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();
    const user = {
      id,
      email,
      password_hash,
      nickname,
      avatar_url: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(nickname)}`,
      created_at: now,
      updated_at: now,
    };
    users.set(id, user);
    userStats.set(id, { wins: 0, losses: 0, rating: 1000 });
    return publicUser(user);
  },

  async verifyPassword(user, plainPassword) {
    return bcrypt.compare(plainPassword, user.password_hash);
  },

  getPublicUser(user) {
    return publicUser(user);
  },

  getStats(userId) {
    return userStats.get(userId) ?? null;
  },
};
