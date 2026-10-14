import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { SESSION_COOKIE } from "@/server/session";

export async function createUser(username: string | null = "ana") {
  return db.user.create({
    data: {
      username,
      usernameKey: username?.toLowerCase() ?? null,
      avatarShape: "circle",
      avatarColor: "violet",
    },
  });
}

export async function createSession(userId: string, expires = new Date(Date.now() + 24 * 60 * 60 * 1000)) {
  const sessionToken = randomUUID();
  await db.session.create({ data: { sessionToken, userId, expires } });
  return sessionToken;
}

export function requestWithSession(url: string, sessionToken?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (sessionToken) headers.set("cookie", `${SESSION_COOKIE}=${sessionToken}`);
  return new Request(new URL(url, "http://localhost:3000"), { ...init, headers });
}
