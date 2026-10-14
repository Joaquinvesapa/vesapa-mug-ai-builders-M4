"use client";

import type { CSSProperties } from "react";
import type { BlockView } from "@/domain/grid-view";
import { useBlockGestures } from "./useBlockGestures";

type Props = {
  block: BlockView;
  selected?: boolean;
  onToggle?: (showId: string) => void;
  onOpenDetail: (showId: string) => void;
};

export function ShowBlock({ block, selected = false, onToggle, onOpenDetail }: Props) {
  const gestures = useBlockGestures({
    onTap: onToggle ? () => onToggle(block.showId) : undefined,
    onLongPress: () => onOpenDetail(block.showId),
  });

  return (
    <div className="absolute inset-x-1" style={{ top: block.top, height: block.height }}>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`${block.artist}, ${block.stageName}, ${block.startLabel} a ${block.endLabel}`}
        style={{ "--stage-color": block.colorHex } as CSSProperties}
        className={`flex h-full w-full touch-pan-x touch-pan-y select-none flex-col overflow-hidden rounded-md px-1.5 py-1 pr-7 text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${
          selected
            ? "border-2 border-white bg-[var(--stage-color)] text-neutral-950"
            : "bg-[color-mix(in_srgb,var(--stage-color)_35%,transparent)] text-white"
        }`}
        {...gestures}
      >
        <span className="truncate text-sm leading-5 font-bold">{block.artist}</span>
        {block.showTime && (
          <span className="truncate text-xs leading-4">
            {block.startLabel}–{block.endLabel}
          </span>
        )}
      </button>
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
