"use client";

import { useSearchParams } from "next/navigation";

/** Auth.js redirects here with ?error= when Google sign-in fails or is cancelled (FR-096). */
export function GoogleError() {
  const error = useSearchParams().get("error");
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-950 p-3 text-red-200">
      No se pudo iniciar sesión con Google
    </p>
  );
}
