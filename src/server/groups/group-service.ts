import { db } from "@/server/db";
import {
  activeInvitationWhere,
  expiresAt,
  isUniqueViolation,
  lockGroup,
  type Tx,
} from "@/server/groups/shared";

export const GROUP_NAME_MAX = 40;

type Ok = { status: "ok" };
const OK: Ok = { status: "ok" };
const FORBIDDEN = { status: "forbidden" } as const;

function normalizeName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= GROUP_NAME_MAX ? trimmed : null;
}

type OwnedGroup = { id: string; ownerId: string };

/** Runs `fn` only if the actor currently owns their group, with the group row locked (FR-052). */
export async function withOwnedGroup<T>(actorId: string, fn: (tx: Tx, group: OwnedGroup) => Promise<T>) {
  return db.$transaction(async (tx) => {
    const membership = await tx.membership.findUnique({ where: { userId: actorId } });
    if (!membership) return FORBIDDEN;
    await lockGroup(tx, membership.groupId);
    const group = await tx.group.findUniqueOrThrow({ where: { id: membership.groupId } });
    if (group.ownerId !== actorId) return FORBIDDEN;
    return fn(tx, group);
  });
}

/** Creates a private group with the actor as owner and member (FR-050). */
export async function createGroup(actorId: string, name: string) {
  const groupName = normalizeName(name);
  if (!groupName) return { status: "invalid_name" } as const;

  try {
    return await db.$transaction(async (tx) => {
      if (await tx.membership.findUnique({ where: { userId: actorId } })) return { status: "already_in_group" } as const;
      const group = await tx.group.create({ data: { name: groupName, ownerId: actorId } });
      await tx.membership.create({ data: { groupId: group.id, userId: actorId } });
      // Pending invitations from other groups can no longer be accepted; free their slots.
      await tx.invitation.updateMany({ where: { inviteeId: actorId, status: "PENDING" }, data: { status: "CANCELLED" } });
      return { status: "ok", groupId: group.id } as const;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { status: "already_in_group" } as const;
    throw error;
  }
}

/** The actor's own group; there is no way to read someone else's (FR-081, AC-102). */
export async function getMyGroup(actorId: string, now = new Date()) {
  const membership = await db.membership.findUnique({
    where: { userId: actorId },
    include: {
      group: {
        include: {
          members: { include: { user: true }, orderBy: [{ joinedAt: "asc" }, { userId: "asc" }] },
          invitations: {
            where: activeInvitationWhere(now),
            include: { invitee: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!membership) return null;
  const { group } = membership;
  const isOwner = group.ownerId === actorId;

  return {
    id: group.id,
    name: group.name,
    isOwner,
    members: group.members.map((m) => ({
      userId: m.userId,
      username: m.user.username!,
      avatarShape: m.user.avatarShape,
      avatarColor: m.user.avatarColor,
      isOwner: m.userId === group.ownerId,
    })),
    // Only the current owner sees pending invitations (FR-057).
    pendingInvitations: isOwner
      ? group.invitations.map((i) => ({
          id: i.id,
          inviteeUsername: i.invitee.username!,
          status: "pendiente" as const,
          expiresAt: expiresAt(i.createdAt),
        }))
      : [],
  };
}

export async function renameGroup(actorId: string, name: string) {
  return withOwnedGroup(actorId, async (tx, group) => {
    const groupName = normalizeName(name);
    if (!groupName) return { status: "invalid_name" } as const;
    await tx.group.update({ where: { id: group.id }, data: { name: groupName } });
    return OK;
  });
}

export async function transferOwnership(actorId: string, newOwnerId: string) {
  return withOwnedGroup(actorId, async (tx, group) => {
    const target = await tx.membership.findUnique({ where: { userId: newOwnerId } });
    if (!target || target.groupId !== group.id) return { status: "not_member" } as const;
    await tx.group.update({ where: { id: group.id }, data: { ownerId: newOwnerId } });
    return OK;
  });
}

/** A non-owner member leaves; the owner must transfer ownership or delete the group (FR-050, FR-055). */
export async function leaveGroup(actorId: string) {
  return db.$transaction(async (tx) => {
    const membership = await tx.membership.findUnique({ where: { userId: actorId } });
    if (!membership) return { status: "not_member" } as const;
    await lockGroup(tx, membership.groupId);
    const group = await tx.group.findUniqueOrThrow({ where: { id: membership.groupId } });
    if (group.ownerId === actorId) return { status: "owner_cannot_leave" } as const;
    await tx.membership.delete({ where: { userId: actorId } });
    return OK;
  });
}

export async function removeMember(actorId: string, memberId: string) {
  return withOwnedGroup(actorId, async (tx, group) => {
    if (memberId === actorId) return { status: "owner_cannot_leave" } as const;
    const target = await tx.membership.findUnique({ where: { userId: memberId } });
    if (!target || target.groupId !== group.id) return { status: "not_member" } as const;
    await tx.membership.delete({ where: { userId: memberId } });
    return OK;
  });
}

/** Deletes the group with its memberships and invitations at once (FR-056). */
export async function deleteGroup(actorId: string) {
  return withOwnedGroup(actorId, async (tx, group) => {
    await tx.group.delete({ where: { id: group.id } });
    return OK;
  });
}
