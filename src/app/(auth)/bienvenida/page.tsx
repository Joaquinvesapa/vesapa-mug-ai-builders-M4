import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requirePageSession } from "@/server/page-session";
import { UsernameForm } from "./username-form";

export default function WelcomePage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Elegí tu nombre de usuario</h1>
      <p className="text-neutral-300">Es como te van a encontrar para invitarte a un grupo.</p>
      <Suspense>
        <PendingUsername />
      </Suspense>
    </main>
  );
}

async function PendingUsername() {
  const user = await requirePageSession();
  if (user.username) redirect("/");
  return <UsernameForm />;
}
