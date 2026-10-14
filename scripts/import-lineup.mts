import { readFileSync } from "node:fs";
import { festival } from "@config/festival";
import { db } from "@/server/db";
import { importLineup, LineupImportError } from "@/server/lineup-import";

const args = process.argv.slice(2);
const allowDeletions = args.includes("--allow-deletions");
const file = args.find((arg) => !arg.startsWith("--"));

if (!file) {
  console.error("Uso: npm run import:lineup -- <archivo.csv> [--allow-deletions]");
  process.exit(2);
}

try {
  const summary = await importLineup(readFileSync(file, "utf8"), { festivalDays: festival.days, allowDeletions });
  console.log(`Line-up importado: ${summary.created} creados, ${summary.updated} actualizados, ${summary.deleted} eliminados.`);
} catch (error) {
  if (error instanceof LineupImportError) {
    console.error("Importación rechazada; no se modificó nada:");
    for (const message of error.errors) console.error(`- ${message}`);
    process.exitCode = 1;
  } else {
    throw error;
  }
} finally {
  await db.$disconnect();
}
