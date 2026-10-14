import { randomUUID } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { randomAvatar } from "@/domain/avatar";
import { isValidPin, isValidUsername, usernameKey } from "@/domain/credentials";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { SESSION_MAX_AGE_MS } from "@/server/session";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export type PinLoginResult =
  | { status: "ok"; userId: string; sessionToken: string; expires: Date }
  | { status: "invalid_format" }
  | { status: "invalid_credentials" };

const INVALID: PinLoginResult = { status: "invalid_credentials" };

let decoyHash: Promise<string> | undefined;
/** Verifying against a decoy keeps rejected paths as slow as a wrong PIN (FR-014). */
async function verifyDecoy(pin: string) {
  decoyHash ??= hash(randomUUID());
  await verify(await decoyHash, pin);
}

async function createSession(userId: string, now: Date): Promise<PinLoginResult> {
  const sessionToken = randomUUID();
  const expires = new Date(now.getTime() + SESSION_MAX_AGE_MS);
  await db.session.create({ data: { sessionToken, userId, expires } });
  return { status: "ok", userId, sessionToken, expires };
}

async function signUp(username: string, pin: string, now: Date): Promise<PinLoginResult | null> {
  try {
    const user = await db.user.create({
      data: { username, usernameKey: usernameKey(username), pinHash: await hash(pin), ...randomAvatar() },
    });
    return createSession(user.id, now);
  } catch (error) {
    // Someone registered the same username concurrently: fall back to a regular sign-in.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}

async function recordFailure(userId: string, now: Date) {
  const lockedUntil = new Date(now.getTime() + LOCK_DURATION_MS);
  await db.$executeRaw`
    UPDATE "User"
    SET "lockedUntil" = CASE WHEN "failedAttempts" + 1 >= ${MAX_FAILED_ATTEMPTS} THEN ${lockedUntil} ELSE "lockedUntil" END,
        "failedAttempts" = CASE WHEN "failedAttempts" + 1 >= ${MAX_FAILED_ATTEMPTS} THEN 0 ELSE "failedAttempts" + 1 END
    WHERE "id" = ${userId}`;
}

/**
 * Signs in with username + PIN, creating the account when the username is free (FR-010, FR-011).
 * Wrong PIN, locked user and Google account produce the same result (FR-013, FR-014).
 */
export async function loginWithPin(input: { username: string; pin: string }, now = new Date()): Promise<PinLoginResult> {
  const { username, pin } = input;
  if (!isValidUsername(username) || !isValidPin(pin)) return { status: "invalid_format" };

  let user = await db.user.findUnique({ where: { usernameKey: usernameKey(username) } });
  if (!user) {
    const created = await signUp(username, pin, now);
    if (created) return created;
    user = await db.user.findUnique({ where: { usernameKey: usernameKey(username) } });
    if (!user) return INVALID;
  }

  if (!user.pinHash) {
    await verifyDecoy(pin);
    return INVALID;
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
    await verify(user.pinHash, pin);
    return INVALID;
  }

  if (!(await verify(user.pinHash, pin))) {
    await recordFailure(user.id, now);
    return INVALID;
  }

  await db.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } });
  return createSession(user.id, now);
}
