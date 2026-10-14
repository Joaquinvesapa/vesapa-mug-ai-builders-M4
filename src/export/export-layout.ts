import { blockText } from "@/domain/grid-layout";
import type { BlockView, DayView } from "@/domain/grid-view";

export const EXPORT_FORMATS = {
  "1080x1920": { width: 1080, height: 1920 },
  "1080x1350": { width: 1080, height: 1350 },
} as const;
export type ExportFormat = keyof typeof EXPORT_FORMATS;

/** Fixed output sizes: text never shrinks with the grid (FR-072). */
export const EXPORT_TEXT = { artistFontPx: 20, timeFontPx: 16, artistLine: 24, timeLine: 20, padding: 6 };
export const EXPORT_MARGIN = 30;
export const EXPORT_TITLE_HEIGHT = 110;
export const EXPORT_STAGE_ROW = 44;
/** Width of the hour axis in app units (3.5rem). */
const AXIS_APP_WIDTH = 56;
const BLOCK_INSET = 2;

type Rect = { x: number; y: number; width: number; height: number };
export type ExportColumn = Rect & { name: string; colorHex: string };
export type ExportBlock = Rect & {
  showId: string;
  block: BlockView;
  showTime: boolean;
  artistFontPx: number;
  timeFontPx: number;
};
export type ExportLayout = {
  canvas: { width: number; height: number };
  scale: number;
  grid: Rect;
  bodyY: number;
  axis: { x: number; width: number };
  columns: ExportColumn[];
  hourMarks: { y: number; label: string }[];
  blocks: ExportBlock[];
};

/**
 * Fits the whole day grid into the canvas with a single uniform scale, so it is never
 * cropped or deformed (FR-071, AC-108); text keeps fixed minimum sizes (FR-072).
 */
export function layoutExport(view: DayView, format: ExportFormat): ExportLayout {
  const canvas = EXPORT_FORMATS[format];
  const gridAppWidth = AXIS_APP_WIDTH + view.columns.length * view.columnWidth;
  const availableWidth = canvas.width - 2 * EXPORT_MARGIN;
  const availableHeight = canvas.height - EXPORT_TITLE_HEIGHT - EXPORT_STAGE_ROW - 2 * EXPORT_MARGIN;
  const scale = Math.min(availableWidth / gridAppWidth, view.height > 0 ? availableHeight / view.height : Infinity);

  const gridWidth = gridAppWidth * scale;
  const x0 = (canvas.width - gridWidth) / 2;
  const gridY = EXPORT_MARGIN + EXPORT_TITLE_HEIGHT;
  const bodyY = gridY + EXPORT_STAGE_ROW;
  const bodyHeight = view.height * scale;
  const columnWidth = view.columnWidth * scale;
  const columnX = (index: number) => x0 + AXIS_APP_WIDTH * scale + index * columnWidth;

  return {
    canvas: { ...canvas },
    scale,
    grid: { x: x0, y: gridY, width: gridWidth, height: EXPORT_STAGE_ROW + bodyHeight },
    bodyY,
    axis: { x: x0, width: AXIS_APP_WIDTH * scale },
    columns: view.columns.map((column, index) => ({
      x: columnX(index),
      y: gridY,
      width: columnWidth,
      height: EXPORT_STAGE_ROW + bodyHeight,
      name: column.name,
      colorHex: column.colorHex,
    })),
    hourMarks: view.hourMarks.map((mark) => ({ y: bodyY + mark.top * scale, label: mark.label })),
    blocks: view.blocks.map((block) => {
      const laneWidth = columnWidth / block.lanes;
      const height = block.height * scale;
      return {
        showId: block.showId,
        block,
        x: columnX(block.column) + block.lane * laneWidth + BLOCK_INSET,
        y: bodyY + block.top * scale,
        width: laneWidth - 2 * BLOCK_INSET,
        height,
        showTime: blockText(height, EXPORT_TEXT).showTime,
        artistFontPx: EXPORT_TEXT.artistFontPx,
        timeFontPx: EXPORT_TEXT.timeFontPx,
      };
    }),
  };
}
