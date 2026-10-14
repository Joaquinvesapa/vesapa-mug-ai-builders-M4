"use client";

import { useMemo, useState } from "react";
import type { DayView } from "@/domain/grid-view";
import { findOverlaps } from "@/domain/overlap";
import { showStatus, STATUS_LABELS } from "@/domain/show-status";
import { setSelectionAction } from "@/server/actions/selection";
import { DayGrid } from "./DayGrid";
import { OverlapWarning } from "./OverlapWarning";
import { useServerClock } from "./useServerClock";

type Props = {
  view: DayView;
  initialSelectedIds: readonly string[];
  /** Server instant at render time (ISO-8601). */
  serverNow: string;
  setSelected?: (showId: string, selected: boolean) => Promise<unknown>;
};

export function PersonalDayGrid({ view, initialSelectedIds, serverNow, setSelected = setSelectionAction }: Props) {
  const [selected, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set(initialSelectedIds));
  const [error, setError] = useState<string | null>(null);
  const now = useServerClock(serverNow);

  async function change(showId: string, value: boolean) {
    const update = (on: boolean) =>
      setSelectedIds((current) => {
        const next = new Set(current);
        if (on) next.add(showId);
        else next.delete(showId);
        return next;
      });
    setError(null);
    update(value);
    try {
      await setSelected(showId, value);
    } catch {
      update(!value);
      setError("No se pudo guardar el cambio. Probá de nuevo.");
    }
  }

  const selectedBlocks = useMemo(() => view.blocks.filter((b) => selected.has(b.showId)), [view.blocks, selected]);
  const overlaps = useMemo(
    () =>
      findOverlaps(
        selectedBlocks.map((b) => ({ id: b.showId, artist: b.artist, startsAt: new Date(b.startsAt), endsAt: new Date(b.endsAt) })),
      ),
    [selectedBlocks],
  );
  const warnedIds = useMemo(() => new Set(overlaps.flatMap((o) => [o.first.id, o.second.id])), [overlaps]);
  const statuses = useMemo(
    () =>
      new Map(
        selectedBlocks.map((b) => [b.showId, STATUS_LABELS[showStatus(new Date(b.startsAt), new Date(b.endsAt), now)]]),
      ),
    [selectedBlocks, now],
  );

  return (
    <>
      {error && (
        <p role="alert" className="mx-4 mb-2 text-red-300">
          {error}
        </p>
      )}
      <OverlapWarning overlaps={overlaps} />
      <DayGrid
        view={view}
        selectedIds={selected}
        onToggle={(id) => change(id, !selected.has(id))}
        statusOf={(id) => statuses.get(id)}
        warnedIds={warnedIds}
        detailActions={(block) => {
          const isSelected = selected.has(block.showId);
          return (
            <button
              type="button"
              onClick={() => change(block.showId, !isSelected)}
              className="rounded-lg bg-violet-600 px-4 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {isSelected ? "Quitar de mi grilla" : "Agregar a mi grilla"}
            </button>
          );
        }}
      />
    </>
  );
}
