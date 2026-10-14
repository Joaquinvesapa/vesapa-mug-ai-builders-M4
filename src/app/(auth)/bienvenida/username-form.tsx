"use client";

import { useActionState } from "react";
import { chooseUsernameAction } from "@/server/actions/auth";

export function UsernameForm() {
  const [state, action, pending] = useActionState(chooseUsernameAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span>Nombre de usuario</span>
        <input
          name="username"
          required
          minLength={3}
          maxLength={30}
          className="rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-red-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-violet-600 px-4 py-3 font-bold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Guardar
      </button>
    </form>
  );
}
