import { stageColor, type PaletteColor } from "@/domain/palettes";
import { formatFestivalTime } from "@/domain/time";

/** Vertical scale shared by every column and block; adjustable in visual design. */
export const MINUTE_HEIGHT_PX = 2;
/** Columns keep a fixed width regardless of the number of stages (FR-097). */
export const COLUMN_WIDTH_PX = 140;

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export type GridStage = { id: string; name: string; position: number };
export type GridShow = { id: string; artist: string; stageId: string; startsAt: Date; endsAt: Date };

export type GridColumn = { stageId: string; name: string; color: PaletteColor; index: number };
export type GridBlock = {
  showId: string;
  column: number;
  top: number;
  height: number;
  color: PaletteColor;
  /** Side-by-side lane inside the column when shows of the same stage overlap. */
  lane: number;
  lanes: number;
};
export type HourMark = { label: string; top: number };

export type DayLayout = {
  columns: GridColumn[];
  blocks: GridBlock[];
  hourMarks: HourMark[];
  axisStart: Date | null;
  axisEnd: Date | null;
  height: number;
  isEmpty: boolean;
};

const minutesBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / MINUTE_MS;

/** Lays out a festival day: one column per stage, vertical axis from first start to last end. */
export function layoutDay(stages: readonly GridStage[], shows: readonly GridShow[]): DayLayout {
  const columns = [...stages]
    .sort((a, b) => a.position - b.position)
    .map((stage, index) => ({ stageId: stage.id, name: stage.name, color: stageColor(stage.position), index }));

  if (shows.length === 0) {
    return { columns, blocks: [], hourMarks: [], axisStart: null, axisEnd: null, height: 0, isEmpty: true };
  }

  const axisStart = new Date(Math.min(...shows.map((s) => s.startsAt.getTime())));
  const axisEnd = new Date(Math.max(...shows.map((s) => s.endsAt.getTime())));
  const columnOf = new Map(columns.map((c) => [c.stageId, c]));

  const lanes = assignLanes(shows);
  const blocks = shows.flatMap((show) => {
    const column = columnOf.get(show.stageId);
    if (!column) return [];
    return [
      {
        showId: show.id,
        column: column.index,
        top: minutesBetween(axisStart, show.startsAt) * MINUTE_HEIGHT_PX,
        height: minutesBetween(show.startsAt, show.endsAt) * MINUTE_HEIGHT_PX,
        color: column.color,
        ...lanes.get(show.id)!,
      },
    ];
  });

  const hourMarks: HourMark[] = [];
  for (let t = Math.ceil(axisStart.getTime() / HOUR_MS) * HOUR_MS; t <= axisEnd.getTime(); t += HOUR_MS) {
    const instant = new Date(t);
    hourMarks.push({ label: formatFestivalTime(instant), top: minutesBetween(axisStart, instant) * MINUTE_HEIGHT_PX });
  }

  return {
    columns,
    blocks,
    hourMarks,
    axisStart,
    axisEnd,
    height: minutesBetween(axisStart, axisEnd) * MINUTE_HEIGHT_PX,
    isEmpty: false,
  };
}

/** Greedy lane assignment per stage; overlapping clusters share their lane count. */
function assignLanes(shows: readonly GridShow[]): Map<string, { lane: number; lanes: number }> {
  const result = new Map<string, { lane: number; lanes: number }>();
  const byStage = Map.groupBy(shows, (s) => s.stageId);

  for (const stageShows of byStage.values()) {
    const sorted = [...stageShows].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.id.localeCompare(b.id));
    let cluster: { id: string; lane: number }[] = [];
    let laneEnds: number[] = [];
    let clusterEnd = -Infinity;

    const flush = () => {
      for (const item of cluster) result.set(item.id, { lane: item.lane, lanes: laneEnds.length });
      cluster = [];
      laneEnds = [];
    };

    for (const show of sorted) {
      if (show.startsAt.getTime() >= clusterEnd) flush();
      let lane = laneEnds.findIndex((end) => end <= show.startsAt.getTime());
      if (lane === -1) lane = laneEnds.push(0) - 1;
      laneEnds[lane] = show.endsAt.getTime();
      cluster.push({ id: show.id, lane });
      clusterEnd = Math.max(clusterEnd, show.endsAt.getTime());
    }
    flush();
  }
  return result;
}

export type TextMetrics = { artistLine: number; timeLine: number; padding: number };

/**
 * Text rule shared by the app and the PNG: when a block is too short, the time is
 * omitted first; the artist always stays and is truncated with "…" by the renderer.
 */
export function blockText(height: number, { artistLine, timeLine, padding }: TextMetrics) {
  return { showArtist: true, showTime: height >= padding * 2 + artistLine + timeLine };
}
