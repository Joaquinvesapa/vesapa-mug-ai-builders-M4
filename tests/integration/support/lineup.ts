import { readFileSync } from "node:fs";
import { importLineup } from "@/server/lineup-import";

export const FIXTURE_DAYS = ["2026-11-21", "2026-11-22"];

export async function importFixture(name = "valid.csv") {
  await importLineup(readFileSync(`tests/fixtures/lineup/${name}`, "utf8"), { festivalDays: FIXTURE_DAYS });
}
