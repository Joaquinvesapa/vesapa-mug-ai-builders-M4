import type { User } from "@/generated/prisma/client";
import { db } from "@/server/db";

/** Cookie names used by Auth.js v5 database sessions (plain and HTTPS). */
export const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = `__Secure-${SESSION_COOKIE}`;

const DAY_MS = 24 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_MS = 30 * DAY_MS;
/** A session is extended at most once per day of use. */
const SESSION_UPDATE_AGE_MS = DAY_MS;

export function readSessionToken(cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const cookies = new Map(
    cookieHeader.split(";").map((part) => {
      const [name, ...value] = part.trim().split("=");
      return [name, value.join("=")] as const;
    }),
  );
  return cookies.get(SECURE_SESSION_COOKIE) ?? cookies.get(SESSION_COOKIE) ?? undefined;
}

/** Resolves the user behind a session token, renewing the session when used (FR-083). */
export async function getSessionUser(sessionToken: string | undefined, now = new Date()): Promise<User | null> {
  if (!sessionToken) return null;
  const session = await db.session.findUnique({ where: { sessionToken }, include: { user: true } });
  if (!session || session.expires.getTime() <= now.getTime()) return null;

  if (session.expires.getTime() - now.getTime() < SESSION_MAX_AGE_MS - SESSION_UPDATE_AGE_MS) {
    await db.session.update({
      where: { sessionToken },
      data: { expires: new Date(now.getTime() + SESSION_MAX_AGE_MS) },
    });
  }
  return session.user;
}

export type ApiUserResult = { user: User; response?: undefined } | { user?: undefined; response: Response };

/** Authenticates an API request; content is only served to users who completed their username. */
export async function requireApiUser(request: Request, now = new Date()): Promise<ApiUserResult> {
  const user = await getSessionUser(readSessionToken(request.headers.get("cookie")), now);
  if (!user || !user.username) {
    return { response: Response.json({ error: "unauthenticated" }, { status: 401 }) };
  }
  return { user };
}
