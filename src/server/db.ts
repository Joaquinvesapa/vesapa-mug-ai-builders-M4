import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForDb = globalThis as unknown as { db?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForDb.db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalForDb.db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  }
  return globalForDb.db;
}

/** Created on first use so builds and imports do not require DATABASE_URL. */
export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
