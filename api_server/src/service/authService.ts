import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createDbClient } from "../repository/dbClient";
import { userRepository } from "../repository/userRepository";
import { ApiError } from "../utils/apiError";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "7d";

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: userId }, secret, { expiresIn: JWT_EXPIRES_IN });
}

export const authService = {
  register: async (email: string, nickname: string, password: string) => {
    const { db, close } = createDbClient();
    try {
      if (await userRepository.emailExists(db, email)) {
        throw new ApiError(409, "AUTH_EMAIL_EXISTS");
      }
      if (await userRepository.nicknameExists(db, nickname)) {
        throw new ApiError(409, "AUTH_NICKNAME_EXISTS");
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await userRepository.create(db, { email, nickname, passwordHash });

      return { access_token: signToken(user.id), user };
    } finally {
      await close();
    }
  },

  login: async (email: string, password: string) => {
    const { db, close } = createDbClient();
    try {
      const user = await userRepository.findByEmail(db, email);
      if (!user || !user.passwordHash) {
        throw new ApiError(401, "AUTH_INVALID_CREDENTIALS");
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        throw new ApiError(401, "AUTH_INVALID_CREDENTIALS");
      }

      return { access_token: signToken(user.id), user };
    } finally {
      await close();
    }
  },
};
