import { redirect } from "next/navigation";
import { Suspense } from "react";
import { festival } from "@config/festival";
import { defaultFestivalDay } from "@/domain/festival-days";
import { requirePageUser } from "@/server/page-session";

export default function Home() {
  return (
    <Suspense>
      <OpenDefaultDay />
    </Suspense>
  );
}

async function OpenDefaultDay(): Promise<never> {
  await requirePageUser();
  redirect(`/grilla/${defaultFestivalDay(festival.days, new Date())}`);
}
