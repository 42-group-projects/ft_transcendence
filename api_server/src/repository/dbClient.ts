import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

export type AppDb = PostgresJsDatabase<typeof schema>;

export type DbClient = {
  db: AppDb;
  close: () => Promise<void>;
};

export function createDbClient(): DbClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  return {
    db,
    close: () => client.end(),
  };
}
