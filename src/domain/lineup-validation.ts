import { parse } from "csv-parse/sync";
import { z } from "zod";
import { festivalTimeToInstant } from "@/domain/time";

export const LINEUP_COLUMNS = ["id", "artist", "description", "day", "stage", "start", "end"] as const;
export const MAX_STAGES = 5;

export type ParsedStage = { name: string; position: number };
export type ParsedShow = {
  id: string;
  artist: string;
  description: string;
  festivalDay: string;
  stage: string;
  startsAt: Date;
  endsAt: Date;
};
export type LineupResult =
  | { ok: true; stages: ParsedStage[]; shows: ParsedShow[] }
  | { ok: false; errors: string[] };

const required = (field: string) => z.string().min(1, `falta ${field}`);

const rowSchema = z.object({
  id: required("id"),
  artist: required("artist"),
  description: required("description"),
  day: required("day").regex(/^\d{4}-\d{2}-\d{2}$/, "day debe tener formato YYYY-MM-DD"),
  stage: required("stage"),
  start: required("start").regex(/^([01]\d|2[0-3]):[0-5]\d$/, "start debe tener formato HH:MM"),
  end: required("end").regex(/^([01]\d|2[0-3]):[0-5]\d$/, "end debe tener formato HH:MM"),
});

/** Validates the whole line-up CSV before anything is loaded (FR-003, FR-004). */
export function parseLineup(text: string, festivalDays: readonly string[]): LineupResult {
  let records: string[][];
  try {
    records = parse(text, { skip_empty_lines: true, trim: true, relax_column_count: true });
  } catch (error) {
    return { ok: false, errors: [`CSV ilegible: ${(error as Error).message}`] };
  }

  const [header, ...rows] = records;
  if (!header || header.join(",") !== LINEUP_COLUMNS.join(",")) {
    return { ok: false, errors: [`encabezado inválido: se espera ${LINEUP_COLUMNS.join(",")}`] };
  }

  const errors: string[] = [];
  const shows: ParsedShow[] = [];
  const stages: ParsedStage[] = [];
  const seenIds = new Set<string>();

  rows.forEach((cells, index) => {
    const line = index + 2;
    const fail = (message: string) => errors.push(`línea ${line}: ${message}`);

    if (cells.length !== LINEUP_COLUMNS.length) {
      fail(`se esperan ${LINEUP_COLUMNS.length} columnas y hay ${cells.length}`);
      return;
    }
    const parsed = rowSchema.safeParse(Object.fromEntries(LINEUP_COLUMNS.map((c, i) => [c, cells[i]])));
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => fail(issue.message));
      return;
    }
    const row = parsed.data;

    if (seenIds.has(row.id)) fail(`id ${row.id} repetido`);
    seenIds.add(row.id);

    if (!festivalDays.includes(row.day)) {
      fail(`${row.day} no es un día del festival`);
      return;
    }

    let startsAt: Date;
    let endsAt: Date;
    try {
      startsAt = festivalTimeToInstant(row.day, row.start);
      endsAt = festivalTimeToInstant(row.day, row.end);
    } catch (error) {
      fail((error as Error).message);
      return;
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      fail("la finalización debe ser posterior al inicio");
      return;
    }

    if (!stages.some((s) => s.name === row.stage)) stages.push({ name: row.stage, position: stages.length });
    shows.push({
      id: row.id,
      artist: row.artist,
      description: row.description,
      festivalDay: row.day,
      stage: row.stage,
      startsAt,
      endsAt,
    });
  });

  if (stages.length > MAX_STAGES) errors.push(`hay ${stages.length} escenarios; el máximo es ${MAX_STAGES} escenarios`);

  return errors.length > 0 ? { ok: false, errors } : { ok: true, stages, shows };
}
