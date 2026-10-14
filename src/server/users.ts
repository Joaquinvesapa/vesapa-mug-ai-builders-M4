import { isValidUsername, usernameKey } from "@/domain/credentials";
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
