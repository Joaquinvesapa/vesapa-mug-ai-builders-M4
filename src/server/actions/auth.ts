"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/server/auth";
import { requirePageSession } from "@/server/page-session";
import { endSession, readSessionToken, SESSION_COOKIE } from "@/server/session";
import { changeUsername } from "@/server/users";

export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/" });
}

export async function signOutAction() {
  const store = await cookies();
  await endSession(readSessionToken(store.toString()));
  store.delete(SESSION_COOKIE);
  store.delete(`__Secure-${SESSION_COOKIE}`);
  redirect("/login");
}

export type ChooseUsernameState = { error?: string };

const USERNAME_ERRORS = {
  invalid_username: "Usá de 3 a 30 caracteres: letras sin acentos, números, punto o guion bajo.",
  username_taken: "Ese nombre de usuario ya está en uso.",
} as const;

export async function chooseUsernameAction(_state: ChooseUsernameState, formData: FormData): Promise<ChooseUsernameState> {
  const user = await requirePageSession();
  const result = await changeUsername(user.id, String(formData.get("username") ?? ""));
  if (result.status !== "ok") return { error: USERNAME_ERRORS[result.status] };
  redirect("/");
}
