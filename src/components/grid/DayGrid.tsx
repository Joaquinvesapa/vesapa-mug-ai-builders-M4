"use client";

import { useCallback, useState, type ReactNode } from "react";
import type { BlockView, DayView } from "@/domain/grid-view";
import { ShowBlock, type GroupBadge } from "./ShowBlock";
import { ShowDetail } from "./ShowDetail";

const AXIS_WIDTH = "3.5rem";

type Props = {
  view: DayView;
  selectedIds?: ReadonlySet<string>;
  onToggle?: (showId: string) => void;
  /** Temporal status label of the person's own shows (FR-093). */
  statusOf?: (showId: string) => string | undefined;
  /** Shows involved in an overlap of the person's selection (FR-092). */
  warnedIds?: ReadonlySet<string>;
  /** Group count and match flag shown on each block of the group view (FR-062). */
  badgeOf?: (showId: string) => GroupBadge | undefined;
  /** Extra actions rendered in the detail dialog (e.g. add/remove from the personal grid). */
  detailActions?: (block: BlockView) => ReactNode;
};

export function DayGrid({ view, selectedIds, onToggle, statusOf, warnedIds, badgeOf, detailActions }: Props) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const detail = view.blocks.find((b) => b.showId === detailId);
  const template = `${AXIS_WIDTH} repeat(${view.columns.length}, ${view.columnWidth}px)`;

  return (
    <>
      <div
        data-testid="grid-scroll"
        className="relative min-h-0 flex-1 overflow-auto overscroll-contain"
      >
        <div data-testid="grid-canvas" role="table" aria-label={`Grilla del ${view.dayLabel}`} className="w-max">
          <div role="row" className="sticky top-0 z-20 grid bg-neutral-950" style={{ gridTemplateColumns: template }}>
            <div aria-hidden="true" className="sticky left-0 z-30 bg-neutral-950" />
            {view.columns.map((column) => (
              <div
                key={column.stageId}
                role="columnheader"
                className="truncate border-t-4 px-2 py-2 text-sm font-bold"
                style={{ borderTopColor: column.colorHex }}
              >
                {column.name}
              </div>
            ))}
          </div>

          <div role="rowgroup">
            <div role="row" className="grid" style={{ gridTemplateColumns: template }}>
              <div aria-hidden="true" className="sticky left-0 z-10 bg-neutral-950" style={{ height: view.height }}>
                {view.hourMarks.map((mark) => (
                  <span key={mark.top} className="absolute right-1 -translate-y-1/2 text-xs text-neutral-400" style={{ top: mark.top }}>
                    {mark.label}
                  </span>
                ))}
              </div>
              {view.columns.map((column, index) => (
                <div
                  key={column.stageId}
                  role="cell"
                  className="relative border-l border-neutral-800"
                  style={{ height: view.height }}
                >
                  {view.blocks
                    .filter((block) => block.column === index)
                    .map((block) => (
                      <ShowBlock
                        key={block.showId}
                        block={block}
                        selected={selectedIds?.has(block.showId)}
                        status={statusOf?.(block.showId)}
                        warned={warnedIds?.has(block.showId)}
                        badge={badgeOf?.(block.showId)}
                        onToggle={onToggle}
                        onOpenDetail={setDetailId}
                      />
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {detail && (
        <ShowDetail block={detail} dayLabel={view.dayLabel} onClose={closeDetail}>
          {detailActions?.(detail)}
        </ShowDetail>
      )}
    </>
  );
}
