"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  createGroup,
  deleteGroup,
  leaveGroup,
  removeMember,
  renameGroup,
  transferOwnership,
} from "@/server/groups/group-service";
import {
  acceptInvitation,
  cancelInvitation,
  invite,
  rejectInvitation,
} from "@/server/groups/invitation-service";
import { requireActionUser } from "@/server/page-session";

export type ActionState = { error?: string };

const MESSAGES: Record<string, string> = {
  already_in_group: "Ya pertenecés a un grupo.",
  invalid_name: "El nombre del grupo debe tener entre 1 y 40 caracteres.",
  forbidden: "Solo el propietario del grupo puede hacer esto.",
  user_not_found: "No existe una persona con ese nombre de usuario.",
  user_in_group: "Esa persona ya pertenece a un grupo.",
  group_full: "El grupo está completo: 15 lugares contando las invitaciones pendientes.",
  already_invited: "Esa persona ya tiene una invitación pendiente de este grupo.",
  not_pending: "La invitación ya no está pendiente.",
  not_found: "La invitación ya no existe.",
  expired: "La invitación venció.",
  owner_cannot_leave: "Como propietario, transferí la propiedad o eliminá el grupo.",
  not_member: "Esa persona no es miembro del grupo.",
};

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

/** Every group action acts on behalf of the signed-in person only. */
async function run(operation: (actorId: string) => Promise<{ status: string }>): Promise<ActionState> {
  const user = await requireActionUser();
  const result = await operation(user.id);
  if (result.status !== "ok") return { error: MESSAGES[result.status] ?? "No se pudo completar la acción." };
  refresh();
  return {};
}

export async function createGroupAction(_: ActionState, formData: FormData) {
  return run((actor) => createGroup(actor, field(formData, "name")));
}

export async function renameGroupAction(_: ActionState, formData: FormData) {
  return run((actor) => renameGroup(actor, field(formData, "name")));
}

export async function inviteAction(_: ActionState, formData: FormData) {
  return run((actor) => invite(actor, field(formData, "username")));
}

export async function cancelInvitationAction(_: ActionState, formData: FormData) {
  return run((actor) => cancelInvitation(actor, field(formData, "invitationId")));
}

export async function acceptInvitationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const state = await run((actor) => acceptInvitation(actor, field(formData, "invitationId")));
  if (state.error) return state;
  redirect("/grupo");
}

export async function rejectInvitationAction(_: ActionState, formData: FormData) {
  return run((actor) => rejectInvitation(actor, field(formData, "invitationId")));
}

export async function leaveGroupAction() {
  return run((actor) => leaveGroup(actor));
}

export async function removeMemberAction(_: ActionState, formData: FormData) {
  return run((actor) => removeMember(actor, field(formData, "userId")));
}

export async function transferOwnershipAction(_: ActionState, formData: FormData) {
  return run((actor) => transferOwnership(actor, field(formData, "userId")));
}

export async function deleteGroupAction() {
  return run((actor) => deleteGroup(actor));
}
