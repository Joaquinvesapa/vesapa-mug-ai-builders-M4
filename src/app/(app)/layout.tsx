import { Suspense } from "react";
import { festival } from "@config/festival";
import { signOutAction } from "@/server/actions/auth";
import { requirePageUser } from "@/server/page-session";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-neutral-800 px-4 py-3">
        <p className="font-bold">{festival.name}</p>
        <Suspense fallback={<span className="h-6 w-24 animate-pulse rounded bg-neutral-800" />}>
          <UserMenu />
        </Suspense>
      </header>
      {children}
    </div>
  );
}

async function UserMenu() {
  const user = await requirePageUser();
  return (
    <div className="flex items-center gap-3">
      <span>{user.username}</span>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-lg border border-neutral-600 px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
