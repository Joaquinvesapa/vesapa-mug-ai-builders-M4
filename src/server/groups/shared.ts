import { Prisma } from "@/generated/prisma/client";

export type Tx = Prisma.TransactionClient;

export const MAX_GROUP_SIZE = 15;
export const INVITATION_TTL_MS = 15 * 60 * 1000;

/** "Vigente": pending and created less than 15 minutes ago (FR-054). */
export const activeInvitationWhere = (now: Date) => ({
  status: "PENDING" as const,
  createdAt: { gt: new Date(now.getTime() - INVITATION_TTL_MS) },
});

export const isActiveInvitation = (invitation: { status: string; createdAt: Date }, now: Date) =>
  invitation.status === "PENDING" && now.getTime() < invitation.createdAt.getTime() + INVITATION_TTL_MS;

export const expiresAt = (createdAt: Date) => new Date(createdAt.getTime() + INVITATION_TTL_MS);

/** Serializes every change to a group's membership and invitations (FR-051). */
export async function lockGroup(tx: Tx, groupId: string) {
  await tx.$queryRaw`SELECT 1 FROM "Group" WHERE "id" = ${groupId} FOR UPDATE`;
}

export const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

/** Members plus pending invitations still within their 15 minutes. */
export async function occupiedSlots(tx: Tx, groupId: string, now: Date) {
  const [members, invitations] = await Promise.all([
    tx.membership.count({ where: { groupId } }),
    tx.invitation.count({ where: { groupId, ...activeInvitationWhere(now) } }),
  ]);
  return members + invitations;
}
