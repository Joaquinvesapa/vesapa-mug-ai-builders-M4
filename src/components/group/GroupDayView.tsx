"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DayGrid } from "@/components/grid/DayGrid";
import { useServerClock } from "@/components/grid/useServerClock";
import { secondaryButton } from "@/components/ui";
import type { MatchRow } from "@/domain/group-matches";
import type { DayView } from "@/domain/grid-view";
import { showStatus, STATUS_LABELS } from "@/domain/show-status";
import { GroupList } from "./GroupList";

type Props = { view: DayView; rows: readonly MatchRow[]; serverNow: string };

export function GroupDayView({ view, rows, serverNow }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"grid" | "list">("grid");
  const [refreshing, setRefreshing] = useState(false);
  const now = useServerClock(serverNow);
  const rowOf = useMemo(() => new Map(rows.map((r) => [r.showId, r])), [rows]);
  const mine = useMemo(() => new Set(rows.filter((r) => r.selectedByMe).map((r) => r.showId)), [rows]);

  async function refreshView() {
    setRefreshing(true);
    const response = await fetch(`/api/group/view?day=${view.day}`, { cache: "no-store" });
    if (response.status === 404 || response.status === 401) {
      router.push("/grupo?aviso=removido");
      return;
    }
    router.refresh();
    setRefreshing(false);
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-white ${
      active ? "bg-white text-neutral-950" : "border border-neutral-600"
    }`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2">
        <div role="tablist" aria-label="Modo de la vista grupal" className="flex gap-2">
          <button type="button" role="tab" aria-selected={tab === "grid"} onClick={() => setTab("grid")} className={tabClass(tab === "grid")}>
            Grilla
          </button>
          <button type="button" role="tab" aria-selected={tab === "list"} onClick={() => setTab("list")} className={tabClass(tab === "list")}>
            Lista
          </button>
        </div>
        <button type="button" onClick={refreshView} disabled={refreshing} className={secondaryButton}>
          Actualizar
        </button>
      </div>

      {rows.length === 0 && <p className="px-4 pb-2 text-neutral-300">Nadie del grupo eligió shows este día</p>}

      {tab === "grid" ? (
        <DayGrid
          view={view}
          selectedIds={mine}
          statusOf={(id) => {
            const block = mine.has(id) ? view.blocks.find((b) => b.showId === id) : undefined;
            return block && STATUS_LABELS[showStatus(new Date(block.startsAt), new Date(block.endsAt), now)];
          }}
          badgeOf={(id) => {
            const row = rowOf.get(id);
            return row && { count: row.count, isMatch: row.isMatch };
          }}
          detailActions={(block) => {
            const row = rowOf.get(block.showId);
            if (!row) return <p className="mr-auto self-center text-sm text-neutral-400">Nadie del grupo lo eligió</p>;
            return (
              <p className="mr-auto self-center text-sm text-neutral-300">
                {row.isMatch ? `Coinciden: ${row.usernames.join(", ")}` : "1 persona del grupo lo eligió"}
              </p>
            );
          }}
        />
      ) : (
        <div role="tabpanel" aria-label="Lista" className="min-h-0 flex-1 overflow-y-auto">
          <GroupList rows={rows} blocks={view.blocks} />
        </div>
      )}
    </>
  );
}
