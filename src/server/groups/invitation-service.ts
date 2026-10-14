import { usernameKey } from "@/domain/credentials";
import { db } from "@/server/db";
import { withOwnedGroup } from "@/server/groups/group-service";
import {
  activeInvitationWhere,
  expiresAt,
  isActiveInvitation,
  isUniqueViolation,
  lockGroup,
  MAX_GROUP_SIZE,
  occupiedSlots,
} from "@/server/groups/shared";

const OK = { status: "ok" } as const;
const NOT_FOUND = { status: "not_found" } as const;
const EXPIRED = { status: "expired" } as const;

/** The owner invites a registered user by username (FR-053); members plus pending ≤ 15 (FR-051). */
export async function invite(actorId: string, username: string, now = new Date()) {
  return withOwnedGroup(actorId, async (tx, group) => {
    const invitee = await tx.user.findUnique({ where: { usernameKey: usernameKey(username.trim()) } });
    if (!invitee || !invitee.username) return { status: "user_not_found" } as const;
    if (await tx.membership.findUnique({ where: { userId: invitee.id } })) return { status: "user_in_group" } as const;

    const duplicate = await tx.invitation.findFirst({
      where: { groupId: group.id, inviteeId: invitee.id, ...activeInvitationWhere(now) },
    });
    if (duplicate) return { status: "already_invited" } as const;
    if ((await occupiedSlots(tx, group.id, now)) >= MAX_GROUP_SIZE) return { status: "group_full" } as const;

    const invitation = await tx.invitation.create({ data: { groupId: group.id, inviteeId: invitee.id, createdAt: now } });
    return { status: "ok", invitationId: invitation.id } as const;
  });
}

/** Only the invitee accepts a pending invitation; their other pending invitations are invalidated (FR-053, FR-054). */
export async function acceptInvitation(actorId: string, invitationId: string, now = new Date()) {
  try {
    return await db.$transaction(async (tx) => {
      const invitation = await tx.invitation.findFirst({ where: { id: invitationId, inviteeId: actorId } });
      if (!invitation || invitation.status !== "PENDING") return NOT_FOUND;
      if (!isActiveInvitation(invitation, now)) return EXPIRED;

      await lockGroup(tx, invitation.groupId);
      if (await tx.membership.findUnique({ where: { userId: actorId } })) return { status: "already_in_group" } as const;
      if ((await tx.membership.count({ where: { groupId: invitation.groupId } })) >= MAX_GROUP_SIZE) {
        return { status: "group_full" } as const;
      }

      await tx.membership.create({ data: { groupId: invitation.groupId, userId: actorId } });
      await tx.invitation.update({ where: { id: invitation.id }, data: { status: "ACCEPTED" } });
      await tx.invitation.updateMany({
        where: { inviteeId: actorId, status: "PENDING", id: { not: invitation.id } },
        data: { status: "CANCELLED" },
      });
      return OK;
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { status: "already_in_group" } as const;
    throw error;
  }
}

export async function rejectInvitation(actorId: string, invitationId: string, now = new Date()) {
  return db.$transaction(async (tx) => {
    const invitation = await tx.invitation.findFirst({ where: { id: invitationId, inviteeId: actorId } });
    if (!invitation || invitation.status !== "PENDING") return NOT_FOUND;
    if (!isActiveInvitation(invitation, now)) return EXPIRED;
    await tx.invitation.update({ where: { id: invitation.id }, data: { status: "REJECTED" } });
    return OK;
  });
}

/** The current owner cancels a pending invitation, freeing its slot (FR-057). */
export async function cancelInvitation(actorId: string, invitationId: string, now = new Date()) {
  return withOwnedGroup(actorId, async (tx, group) => {
    const invitation = await tx.invitation.findFirst({ where: { id: invitationId, groupId: group.id } });
    if (!invitation) return { status: "forbidden" } as const;
    if (!isActiveInvitation(invitation, now)) return { status: "not_pending" } as const;
    await tx.invitation.update({ where: { id: invitation.id }, data: { status: "CANCELLED" } });
    return OK;
  });
}

/** Pending invitations addressed to the actor (FR-053). */
export async function listReceivedInvitations(actorId: string, now = new Date()) {
  const invitations = await db.invitation.findMany({
    where: { inviteeId: actorId, ...activeInvitationWhere(now) },
    include: { group: { include: { owner: true } } },
    orderBy: { createdAt: "asc" },
  });
  return invitations.map((i) => ({
    id: i.id,
    groupName: i.group.name,
    ownerUsername: i.group.owner.username!,
    expiresAt: expiresAt(i.createdAt),
  }));
}

/** An invitation is readable only by its invitee and the group's current owner (FR-057, AC-103). */
export async function getInvitation(actorId: string, invitationId: string, now = new Date()) {
  const invitation = await db.invitation.findUnique({
    where: { id: invitationId },
    include: { group: { include: { owner: true } }, invitee: true },
  });
  if (!invitation) return null;
  if (invitation.inviteeId !== actorId && invitation.group.ownerId !== actorId) return null;
  return {
    id: invitation.id,
    groupName: invitation.group.name,
    ownerUsername: invitation.group.owner.username!,
    inviteeUsername: invitation.invitee.username!,
    active: isActiveInvitation(invitation, now),
    expiresAt: expiresAt(invitation.createdAt),
  };
}
