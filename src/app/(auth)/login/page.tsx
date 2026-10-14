import { Suspense } from "react";
import { festival } from "@config/festival";
import { signInWithGoogleAction } from "@/server/actions/auth";
import { GoogleError } from "./google-error";
import { PinLoginForm } from "./pin-login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 p-6">
      <header>
        <p className="text-sm text-neutral-400">{festival.name}</p>
        <h1 className="text-2xl font-bold">Entrar</h1>
      </header>

      <Suspense>
        <GoogleError />
      </Suspense>

      <form action={signInWithGoogleAction}>
        <button
          type="submit"
          className="w-full rounded-lg bg-white px-4 py-3 font-bold text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Continuar con Google
        </button>
      </form>

      <div className="flex items-center gap-3 text-sm text-neutral-400" aria-hidden="true">
        <span className="h-px flex-1 bg-neutral-700" />o<span className="h-px flex-1 bg-neutral-700" />
      </div>

      <PinLoginForm />
    </main>
  );
}
