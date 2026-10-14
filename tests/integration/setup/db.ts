import { afterAll, beforeEach } from "vitest";
import { db } from "@/server/db";

const TABLES = [
  "Invitation",
  "Membership",
  "Group",
  "Selection",
  "Session",
  "Account",
  "VerificationToken",
  "User",
  "Show",
  "Stage",
];

export async function resetDb() {
  const list = TABLES.map((t) => `"${t}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
}

/** Registers a clean database before each test of the calling file. */
export function withCleanDb() {
  beforeEach(resetDb);
  afterAll(() => db.$disconnect());
  return db;
}
