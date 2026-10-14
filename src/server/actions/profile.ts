"use server";

import { refresh } from "next/cache";
import type { ActionState } from "@/server/actions/groups";
import { requireActionUser } from "@/server/page-session";
import { changeUsername, updateAvatar } from "@/server/users";

const MESSAGES: Record<string, string> = {
  invalid_username: "Usá de 3 a 30 caracteres: letras sin acentos, números, punto o guion bajo.",
  username_taken: "Ese nombre de usuario ya está en uso.",
  invalid_avatar: "Elegí una forma y un color de las opciones.",
};

/** Profile changes always apply to the signed-in person (FR-020, FR-023). */
export async function changeUsernameAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  const result = await changeUsername(user.id, String(formData.get("username") ?? ""));
  if (result.status !== "ok") return { error: MESSAGES[result.status] };
  refresh();
  return {};
}

export async function updateAvatarAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireActionUser();
  const result = await updateAvatar(user.id, {
    avatarShape: String(formData.get("avatarShape") ?? ""),
    avatarColor: String(formData.get("avatarColor") ?? ""),
  });
  if (result.status !== "ok") return { error: MESSAGES[result.status] };
  refresh();
  return {};
}
