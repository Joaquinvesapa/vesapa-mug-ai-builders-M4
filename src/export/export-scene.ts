import { festival } from "@config/festival";
import type { MatchRow } from "@/domain/group-matches";
import { buildDayView } from "@/domain/grid-view";
import { EXPORT_TEXT, layoutExport, type ExportBlock, type ExportFormat, type ExportLayout } from "@/export/export-layout";
import { getGroupView } from "@/server/groups/group-view";
import { listShowsForDay, listStages } from "@/server/lineup";
import { listSelectedShowIds } from "@/server/selection";

export type ExportRequest = { kind: "personal" | "group"; day: string; format: ExportFormat; includeNames: boolean };

export type SceneLine = { kind: "artist" | "time" | "count" | "names"; text: string; fontPx: number; lineHeight: number };
export type SceneBlock = ExportBlock & { highlighted: boolean; lines: SceneLine[] };
export type ExportScene = {
  request: ExportRequest;
  fileName: string;
  header: { title: string; subtitle: string };
  layout: ExportLayout;
  blocks: SceneBlock[];
};

const line = (kind: SceneLine["kind"], text: string): SceneLine =>
  kind === "artist"
    ? { kind, text, fontPx: EXPORT_TEXT.artistFontPx, lineHeight: EXPORT_TEXT.artistLine }
    : { kind, text, fontPx: EXPORT_TEXT.timeFontPx, lineHeight: EXPORT_TEXT.timeLine };

/** Artist always; then time, group count and names while they fit in the block (FR-072, FR-073). */
function fitLines(block: ExportBlock, extras: SceneLine[]): SceneLine[] {
  const lines = [line("artist", block.block.artist)];
  let used = EXPORT_TEXT.artistLine;
  const available = block.height - 2 * EXPORT_TEXT.padding;
  for (const extra of extras) {
    if (used + extra.lineHeight > available) break;
    lines.push(extra);
    used += extra.lineHeight;
  }
  return lines;
}

/**
 * What the PNG draws: the whole day grid, the requester's shows highlighted and, for the
 * group kind, counts on those shows and names only on request with 2+ selections.
 * Returns null when a group export is requested by someone outside a group (AC-104).
 */
export async function buildExportScene(actorId: string, request: ExportRequest): Promise<ExportScene | null> {
  let rows: Map<string, MatchRow> | null = null;
  let groupName: string | null = null;
  if (request.kind === "group") {
    const group = await getGroupView(actorId, request.day);
    if (!group) return null;
    rows = new Map(group.shows.map((r) => [r.showId, r]));
    groupName = group.groupName;
  }

  const [stages, shows, selectedIds] = await Promise.all([
    listStages(),
    listShowsForDay(request.day),
    listSelectedShowIds(actorId, request.day),
  ]);
  const view = buildDayView(request.day, stages, shows);
  const layout = layoutExport(view, request.format);
  const selected = new Set(selectedIds);

  const blocks = layout.blocks.map((block) => {
    const highlighted = selected.has(block.showId);
    const row = rows?.get(block.showId);
    const extras: SceneLine[] = [];
    if (block.showTime) extras.push(line("time", `${block.block.startLabel}–${block.block.endLabel}`));
    if (highlighted && row) {
      extras.push(line("count", `${row.count} del grupo`));
      if (request.includeNames && row.isMatch) extras.push(line("names", row.usernames.join(", ")));
    }
    return { ...block, highlighted, lines: fitLines(block, extras) };
  });

  return {
    request,
    fileName: `grilla-${request.kind === "group" ? "grupo" : "personal"}-${request.day}-${request.format}.png`,
    header: { title: festival.name, subtitle: groupName ? `${view.dayLabel} · ${groupName}` : view.dayLabel },
    layout,
    blocks,
  };
}
