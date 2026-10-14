import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { festival } from "@config/festival";
import { DaySelector } from "@/components/grid/DaySelector";
import { GridSkeleton } from "@/components/grid/GridSkeleton";
import { GroupDayView } from "@/components/group/GroupDayView";
import { buildDayView } from "@/domain/grid-view";
import { getGroupView } from "@/server/groups/group-view";
import { listShowsForDay, listStages } from "@/server/lineup";
import { requirePageUser } from "@/server/page-session";

export default function GroupViewPage({ params }: PageProps<"/grupo/vista/[dia]">) {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<GridSkeleton />}>
        <GroupViewContent params={params} />
      </Suspense>
    </main>
  );
}

async function GroupViewContent({ params }: { params: PageProps<"/grupo/vista/[dia]">["params"] }) {
  const { dia } = await params;
  if (!festival.days.includes(dia)) notFound();
  const user = await requirePageUser();

  const group = await getGroupView(user.id, dia);
  if (!group) redirect("/grupo");

  const [stages, shows] = await Promise.all([listStages(), listShowsForDay(dia)]);
  const view = buildDayView(dia, stages, shows);

  return (
    <>
      <h1 className="px-4 pt-3 text-lg font-bold">Coincidencias de {group.groupName}</h1>
      <DaySelector days={festival.days} current={dia} basePath="/grupo/vista" />
      <GroupDayView view={view} rows={group.shows} serverNow={new Date().toISOString()} />
    </>
  );
}
