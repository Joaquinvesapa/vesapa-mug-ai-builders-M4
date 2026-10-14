"use client";

import { useMemo, useState } from "react";
import { listMatches, type MatchRow } from "@/domain/group-matches";
import type { BlockView } from "@/domain/grid-view";

type Props = { rows: readonly MatchRow[]; blocks: readonly BlockView[] };

/** List mode of the group view: order by time or count and optional matches-only filter (FR-062). */
export function GroupList({ rows, blocks }: Props) {
  const [by, setBy] = useState<"time" | "count">("time");
  const [onlyMatches, setOnlyMatches] = useState(false);
  const blockOf = useMemo(() => new Map(blocks.map((b) => [b.showId, b])), [blocks]);
  const shows = useMemo(
    () => blocks.map((b) => ({ id: b.showId, artist: b.artist, startsAt: new Date(b.startsAt) })),
    [blocks],
  );
  const listed = listMatches(rows, shows, { by, onlyMatches });

  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <fieldset className="flex items-center gap-3">
          <legend className="sr-only">Ordenar por</legend>
          <span aria-hidden="true" className="text-neutral-400">
            Ordenar por
          </span>
          {(["time", "count"] as const).map((value) => (
            <label key={value} className="flex items-center gap-1">
              <input type="radio" name="order" checked={by === value} onChange={() => setBy(value)} />
              {value === "time" ? "Horario" : "Cantidad"}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={onlyMatches} onChange={(e) => setOnlyMatches(e.target.checked)} />
          Solo coincidencias
        </label>
      </div>
      <ul aria-label="Shows elegidos por el grupo" className="flex flex-col divide-y divide-neutral-800">
        {listed.map((row) => {
          const block = blockOf.get(row.showId)!;
          return (
            <li key={row.showId} className="flex flex-col gap-0.5 py-2">
              <p className="flex items-center justify-between gap-2">
                <span className="font-bold">
                  {row.isMatch && <span aria-hidden="true">★ </span>}
                  {block.artist}
                </span>
                <span className="text-sm">
                  {row.count} del grupo{row.isMatch && ", coincidencia"}
                </span>
              </p>
              <p className="text-sm text-neutral-400">
                {block.stageName} · {block.startLabel}–{block.endLabel}
                {row.selectedByMe && " · en tu grilla"}
              </p>
              {row.isMatch && <p className="text-sm text-neutral-300">Coinciden: {row.usernames.join(", ")}</p>}
            </li>
          );
        })}
      </ul>
      {listed.length === 0 && <p className="text-neutral-400">No hay shows para mostrar con este filtro.</p>}
    </div>
  );
}
