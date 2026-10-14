import { createGroup, getMyGroup } from "@/server/groups/group-service";
import { acceptInvitation, invite } from "@/server/groups/invitation-service";
import { createUser } from "./factories";

export const T0 = new Date("2026-11-21T20:00:00Z");
export const MINUTE = 60_000;
export const after = (ms: number, from = T0) => new Date(from.getTime() + ms);

/** Creates a group owned by `owner` with the given extra members, all joined through invitations. */
export async function groupWith(ownerName: string, memberNames: string[] = [], now = T0) {
  const owner = await createUser(ownerName);
  const created = await createGroup(owner.id, `Grupo de ${ownerName}`);
  if (created.status !== "ok") throw new Error(created.status);
  const members = [];
  for (const name of memberNames) {
    const member = await createUser(name);
    const sent = await invite(owner.id, name, now);
    if (sent.status !== "ok") throw new Error(`invite ${name}: ${sent.status}`);
    const accepted = await acceptInvitation(member.id, sent.invitationId, now);
    if (accepted.status !== "ok") throw new Error(`accept ${name}: ${accepted.status}`);
    members.push(member);
  }
  return { owner, members, groupId: created.groupId, view: () => getMyGroup(owner.id, now) };
}
