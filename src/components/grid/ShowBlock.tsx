"use client";

import type { CSSProperties } from "react";
import type { BlockView } from "@/domain/grid-view";
import { useBlockGestures } from "./useBlockGestures";

export type GroupBadge = { count: number; isMatch: boolean };

type Props = {
  block: BlockView;
  selected?: boolean;
  status?: string;
  warned?: boolean;
  badge?: GroupBadge;
  onToggle?: (showId: string) => void;
  onOpenDetail: (showId: string) => void;
};

export function ShowBlock({ block, selected = false, status, warned = false, badge, onToggle, onOpenDetail }: Props) {
  const groupLabel = badge ? `, ${badge.count} del grupo${badge.isMatch ? ", coincidencia" : ""}` : "";
  const gestures = useBlockGestures({
    onTap: onToggle ? () => onToggle(block.showId) : undefined,
    onLongPress: () => onOpenDetail(block.showId),
  });

  return (
    <div
      className="absolute px-0.5"
      style={{
        top: block.top,
        height: block.height,
        left: `${(block.lane / block.lanes) * 100}%`,
        width: `${100 / block.lanes}%`,
      }}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${block.artist}, ${block.stageName}, ${block.startLabel} a ${block.endLabel}${status ? `, ${status}` : ""}${groupLabel}`}
        style={{ "--stage-color": block.colorHex } as CSSProperties}
        className={`flex h-full w-full touch-pan-x touch-pan-y select-none flex-col overflow-hidden rounded-md px-1.5 py-1 pr-7 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${
          selected
            ? "border-2 border-white bg-[var(--stage-color)] text-neutral-950"
            : "bg-[color-mix(in_srgb,var(--stage-color)_35%,transparent)] text-white"
        }`}
        {...gestures}
      >
        <span className="truncate text-sm leading-5 font-bold">
          {selected && <span aria-hidden="true">✓ </span>}
          {block.artist}
        </span>
        {(block.showTime || status) && (
          <span className="truncate text-xs leading-4" suppressHydrationWarning>
            {block.showTime && `${block.startLabel}–${block.endLabel}`}
            {block.showTime && status && " · "}
            {status}
          </span>
        )}
      </button>
      {badge && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0.5 left-1.5 rounded-full px-1.5 text-xs leading-4 font-bold ${
            badge.isMatch ? "bg-white text-neutral-950" : "bg-neutral-950/60 text-white"
          }`}
        >
          {badge.isMatch ? "★ " : ""}
          {badge.count}
        </span>
      )}
      {warned && (
        <span role="img" aria-label="Se superpone" className="absolute right-0.5 bottom-0.5 text-xs">
          ⚠
        </span>
      )}
      <button
        type="button"
        aria-label={`Ver detalle de ${block.artist}`}
        onClick={() => onOpenDetail(block.showId)}
        className={`absolute top-0.5 right-0.5 flex size-6 items-center justify-center rounded-full text-xs font-bold focus-visible:outline-2 focus-visible:outline-white ${
          selected ? "bg-neutral-950/20 text-neutral-950" : "bg-white/15 text-white"
        }`}
      >
        i
      </button>
    </div>
  );
}
