import { notFound } from "next/navigation";
import { Suspense } from "react";
import { festival } from "@config/festival";
import { DaySelector } from "@/components/grid/DaySelector";
import { GridSkeleton } from "@/components/grid/GridSkeleton";
import { PersonalDayGrid } from "@/components/grid/PersonalDayGrid";
import { buildDayView } from "@/domain/grid-view";
import { listShowsForDay, listStages } from "@/server/lineup";
import { requirePageUser } from "@/server/page-session";
import { listSelectedShowIds } from "@/server/selection";

export default function DayPage({ params }: PageProps<"/grilla/[dia]">) {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<GridSkeleton />}>
        <DayContent params={params} />
      </Suspense>
    </main>
  );
}

async function DayContent({ params }: { params: PageProps<"/grilla/[dia]">["params"] }) {
  const { dia } = await params;
  if (!festival.days.includes(dia)) notFound();
  const user = await requirePageUser();

  const [stages, shows, selectedIds] = await Promise.all([
    listStages(),
    listShowsForDay(dia),
    listSelectedShowIds(user.id, dia),
  ]);
  const view = buildDayView(dia, stages, shows);

  return (
    <>
      <DaySelector days={festival.days} current={dia} basePath="/grilla" />
      <h1 className="sr-only">Grilla del {view.dayLabel}</h1>
      {view.isEmpty ? (
        <p className="p-8 text-center text-neutral-300">No hay shows este día</p>
      ) : (
        <PersonalDayGrid view={view} initialSelectedIds={selectedIds} serverNow={new Date().toISOString()} />
      )}
    </>
  );
}
