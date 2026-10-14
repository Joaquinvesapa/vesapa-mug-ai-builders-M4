import { Suspense } from "react";
import { requirePageUser } from "@/server/page-session";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Suspense>
        <Greeting />
      </Suspense>
    </main>
  );
}

async function Greeting() {
  const user = await requirePageUser();
  return <h1 className="text-2xl font-bold">Hola, {user.username}</h1>;
}
