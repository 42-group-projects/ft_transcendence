export const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Swap this out for a real secret loaded from env in production
export const JWT_SECRET = process.env.JWT_SECRET ?? "mock-super-secret-dev-key";

export const JWT_EXPIRES_IN = "7d";
