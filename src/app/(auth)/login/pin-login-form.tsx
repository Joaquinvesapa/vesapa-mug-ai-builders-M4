"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const ERRORS: Record<string, string> = {
  invalid_credentials: "Nombre de usuario o PIN incorrectos.",
  invalid_format: "Revisá el formato: nombre de 3 a 30 caracteres y PIN de 6 dígitos.",
};

export function PinLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), pin: form.get("pin") }),
    });
    if (response.ok) {
      router.replace("/");
      router.refresh();
      return;
    }
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    setError(ERRORS[body.error ?? ""] ?? "No se pudo iniciar sesión. Probá de nuevo.");
    setPending(false);
  }

  const field =
    "w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-neutral-400">Si el nombre no existe, se crea tu cuenta con ese PIN.</p>
      <label className="flex flex-col gap-1">
        <span>Nombre de usuario</span>
        <input name="username" autoComplete="username" required minLength={3} maxLength={30} className={field} />
      </label>
      <label className="flex flex-col gap-1">
        <span>PIN de 6 dígitos</span>
        <input
          name="pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-violet-500 px-4 py-3 font-bold text-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Entrar
      </button>
    </form>
  );
}
