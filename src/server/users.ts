import { AVATAR_SHAPES } from "@/domain/avatar";
import { isValidUsername, usernameKey } from "@/domain/credentials";
import { AVATAR_COLORS } from "@/domain/palettes";
import type { AvatarColor, AvatarShape } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export type ChangeUsernameResult = { status: "ok" } | { status: "invalid_username" } | { status: "username_taken" };

/** Sets or changes a username; uniqueness ignores case (FR-015, FR-016, FR-020). */
export async function changeUsername(userId: string, username: string): Promise<ChangeUsernameResult> {
  if (!isValidUsername(username)) return { status: "invalid_username" };
  try {
    await db.user.update({ where: { id: userId }, data: { username, usernameKey: usernameKey(username) } });
    return { status: "ok" };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: "username_taken" };
    }
    throw error;
  }
}

export type MyProfile = {
  username: string | null;
  avatarShape: AvatarShape;
  avatarColor: AvatarColor;
  accessMethod: "google" | "pin";
};

/** The signed-in person's full profile; nobody can read another's (FR-020, FR-023). */
export async function getMyProfile(actorId: string): Promise<MyProfile | null> {
  const user = await db.user.findUnique({
    where: { id: actorId },
    include: { accounts: { where: { provider: "google" }, select: { provider: true } } },
  });
  if (!user) return null;
  return {
    username: user.username,
    avatarShape: user.avatarShape,
    avatarColor: user.avatarColor,
    accessMethod: user.accounts.length > 0 ? "google" : "pin",
  };
}

const SHAPES = new Set<string>(AVATAR_SHAPES);
const COLORS = new Set(AVATAR_COLORS.map((c) => c.name));

/** Changes the avatar within the fixed shapes and colors (FR-021). */
export async function updateAvatar(actorId: string, change: { avatarShape?: string; avatarColor?: string }) {
  const { avatarShape, avatarColor } = change;
  if ((avatarShape !== undefined && !SHAPES.has(avatarShape)) || (avatarColor !== undefined && !COLORS.has(avatarColor))) {
    return { status: "invalid_avatar" } as const;
  }
  await db.user.update({
    where: { id: actorId },
    data: { avatarShape: avatarShape as AvatarShape | undefined, avatarColor: avatarColor as AvatarColor | undefined },
  });
  return { status: "ok" } as const;
}

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_LIMIT = 10;

export type PublicUser = { username: string; avatar: { shape: AvatarShape; color: AvatarColor } };

/**
 * Prefix search by username, case-insensitive, excluding the searcher; exposes only
 * username and avatar (FR-022). starts_with() keeps "_" and "." literal, unlike LIKE.
 */
export async function searchUsers(actorId: string, query: string): Promise<PublicUser[] | null> {
  const prefix = usernameKey(query.trim());
  if (prefix.length < SEARCH_MIN_LENGTH) return null;
  const rows = await db.$queryRaw<{ username: string; avatarShape: AvatarShape; avatarColor: AvatarColor }[]>`
    SELECT "username", "avatarShape", "avatarColor" FROM "User"
    WHERE "username" IS NOT NULL AND starts_with("usernameKey", ${prefix}) AND "id" <> ${actorId}
    ORDER BY "usernameKey"
    LIMIT ${SEARCH_LIMIT}`;
  return rows.map((r) => ({ username: r.username, avatar: { shape: r.avatarShape, color: r.avatarColor } }));
}
