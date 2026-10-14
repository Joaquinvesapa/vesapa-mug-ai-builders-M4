import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/generated/prisma/client";
import { getSessionUser, readSessionToken } from "@/server/session";

export type AuthenticatedUser = User & { username: string };

/** Resolves the current user for a page; must run inside a Suspense boundary (Cache Components). */
export async function requirePageUser(): Promise<AuthenticatedUser> {
  const cookieHeader = (await cookies()).toString();
  const user = await getSessionUser(readSessionToken(cookieHeader));
  if (!user) redirect("/login");
  if (!user.username) redirect("/bienvenida");
  return user as AuthenticatedUser;
}

/** Resolves the current user even before choosing a username (first Google access). */
export async function requirePageSession(): Promise<User> {
  const cookieHeader = (await cookies()).toString();
  const user = await getSessionUser(readSessionToken(cookieHeader));
  if (!user) redirect("/login");
  return user;
}
