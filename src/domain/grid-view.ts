import { formatFestivalDay } from "@/domain/festival-days";
import { blockText, COLUMN_WIDTH_PX, layoutDay, type GridStage, type HourMark } from "@/domain/grid-layout";
import { formatFestivalTime } from "@/domain/time";

export type ViewShow = { id: string; artist: string; description: string; stageId: string; startsAt: Date; endsAt: Date };

export type BlockView = {
  showId: string;
  artist: string;
  description: string;
  stageName: string;
  colorHex: string;
  column: number;
  top: number;
  height: number;
  startLabel: string;
  endLabel: string;
  showTime: boolean;
  startsAt: string;
  endsAt: string;
};

export type DayView = {
  day: string;
  dayLabel: string;
  columns: { stageId: string; name: string; colorHex: string }[];
  blocks: BlockView[];
  hourMarks: HourMark[];
  height: number;
  columnWidth: number;
  isEmpty: boolean;
};

/** Line heights of the in-app block text (artist text-sm/leading-5, time text-xs/leading-4). */
export const APP_TEXT_METRICS = { artistLine: 20, timeLine: 16, padding: 4 };

/** Serializable view of a festival day, shared by the grid component and the PNG export. */
export function buildDayView(day: string, stages: readonly GridStage[], shows: readonly ViewShow[]): DayView {
  const layout = layoutDay(stages, shows);
  const byId = new Map(shows.map((s) => [s.id, s]));

  return {
    day,
    dayLabel: formatFestivalDay(day),
    columns: layout.columns.map((c) => ({ stageId: c.stageId, name: c.name, colorHex: c.color.hex })),
    blocks: layout.blocks.map((block) => {
      const show = byId.get(block.showId)!;
      return {
        showId: show.id,
        artist: show.artist,
        description: show.description,
        stageName: layout.columns[block.column].name,
        colorHex: block.color.hex,
        column: block.column,
        top: block.top,
        height: block.height,
        startLabel: formatFestivalTime(show.startsAt),
        endLabel: formatFestivalTime(show.endsAt),
        showTime: blockText(block.height, APP_TEXT_METRICS).showTime,
        startsAt: show.startsAt.toISOString(),
        endsAt: show.endsAt.toISOString(),
      };
    }),
    hourMarks: layout.hourMarks,
    height: layout.height,
    columnWidth: COLUMN_WIDTH_PX,
    isEmpty: layout.isEmpty,
  };
}
