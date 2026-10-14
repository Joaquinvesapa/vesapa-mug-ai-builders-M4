import { parseLineup } from "@/domain/lineup-validation";
import { db } from "@/server/db";

export class LineupImportError extends Error {
  constructor(
    readonly errors: string[],
    readonly missingShowIds: string[] = [],
  ) {
    super(errors.join("\n"));
    this.name = "LineupImportError";
  }
}

export type ImportOptions = {
  festivalDays: readonly string[];
  /** Explicit confirmation to delete shows missing from the CSV, with their selections. */
  allowDeletions?: boolean;
};

export type ImportSummary = { created: number; updated: number; deleted: number };

/** Validates the whole CSV and loads it in a single transaction; nothing is written on failure. */
export async function importLineup(text: string, options: ImportOptions): Promise<ImportSummary> {
  const parsed = parseLineup(text, options.festivalDays);
  if (!parsed.ok) throw new LineupImportError(parsed.errors);

  return db.$transaction(async (tx) => {
    const incomingIds = new Set(parsed.shows.map((s) => s.id));
    const existing = await tx.show.findMany({ select: { id: true } });
    const missingShowIds = existing.map((s) => s.id).filter((id) => !incomingIds.has(id)).sort();

    if (missingShowIds.length > 0 && !options.allowDeletions) {
      throw new LineupImportError(
        [`faltan ${missingShowIds.length} shows existentes: ${missingShowIds.join(", ")}; reimportar con confirmación de eliminación para borrarlos con sus selecciones`],
        missingShowIds,
      );
    }

    const deleted = (await tx.show.deleteMany({ where: { id: { in: missingShowIds } } })).count;

    const stageIds = new Map<string, string>();
    for (const stage of parsed.stages) {
      const saved = await tx.stage.upsert({
        where: { name: stage.name },
        create: { name: stage.name, position: stage.position },
        update: { position: stage.position },
      });
      stageIds.set(stage.name, saved.id);
    }

    const existingIds = new Set(existing.map((s) => s.id));
    let created = 0;
    let updated = 0;
    for (const show of parsed.shows) {
      const data = {
        artist: show.artist,
        description: show.description,
        festivalDay: new Date(`${show.festivalDay}T00:00:00Z`),
        stageId: stageIds.get(show.stage)!,
        startsAt: show.startsAt,
        endsAt: show.endsAt,
      };
      await tx.show.upsert({ where: { id: show.id }, create: { id: show.id, ...data }, update: data });
      if (existingIds.has(show.id)) updated++;
      else created++;
    }

    await tx.stage.deleteMany({ where: { name: { notIn: parsed.stages.map((s) => s.name) } } });

    return { created, updated, deleted };
  });
}
