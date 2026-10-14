/** Seeds the RNF-01/RNF-03 fixture into DATABASE_URL and writes what k6 needs to log in. */
import { mkdirSync, writeFileSync } from "node:fs";
import { db } from "@/server/db";
import { PERF_DAYS, PERF_PIN, seedPerformanceFixture } from "../tests/fixtures/perf/seed";

const output = process.argv[2] ?? "tests/load/results/fixture.json";

const { members } = await seedPerformanceFixture();
mkdirSync(output.slice(0, output.lastIndexOf("/")), { recursive: true });
writeFileSync(output, JSON.stringify({ days: PERF_DAYS, pin: PERF_PIN, usernames: members.map((m) => m.username) }, null, 2));
console.log(`Fixture de rendimiento cargado: 150 shows y un grupo de ${members.length} miembros con 30 shows cada uno.`);
await db.$disconnect();
