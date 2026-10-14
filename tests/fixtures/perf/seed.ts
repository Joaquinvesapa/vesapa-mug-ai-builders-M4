/**
 * Performance fixture of RNF-01 / RNF-03: exactly 150 shows (3 days × 5 stages × 10 shows)
 * and one group of exactly 15 members with 30 selected shows each, spread over the 3 days.
 * Deterministic so that load test runs are comparable.
 */
import { festival } from "@config/festival";
import { loginWithPin } from "@/server/auth/pin-service";
import { createGroup } from "@/server/groups/group-service";
import { acceptInvitation, invite } from "@/server/groups/invitation-service";
import { importLineup } from "@/server/lineup-import";
import { setSelection } from "@/server/selection";

export const PERF_DAYS = festival.days.slice(0, 3);
export const PERF_STAGES = ["Escenario Norte", "Escenario Sur", "Carpa", "Escenario Río", "Patio"];
export const PERF_SHOWS_PER_STAGE_AND_DAY = 10;
export const PERF_MEMBERS = 15;
export const PERF_SELECTIONS_PER_MEMBER = 30;
/** Test-only credential shared by every fixture account; never used outside test databases. */
export const PERF_PIN = "135790";

const time = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function perfLineupCsv(): string {
  const rows = ["id,artist,description,day,stage,start,end"];
  PERF_DAYS.forEach((day, d) => {
    PERF_STAGES.forEach((stage, s) => {
      for (let k = 0; k < PERF_SHOWS_PER_STAGE_AND_DAY; k++) {
        const start = 16 * 60 + k * 60 + s * 5;
        rows.push(`perf-${d}-${s}-${k},Artista ${d}${s}${k},Show de prueba,${day},${stage},${time(start)},${time(start + 50)}`);
      }
    });
  });
  return rows.join("\n");
}

/** Show ids selected by member `index`: 10 per day, shifted per member so counts vary. */
export function perfSelectionsOf(index: number): string[] {
  const perDay = PERF_SELECTIONS_PER_MEMBER / PERF_DAYS.length;
  const showsPerDay = PERF_STAGES.length * PERF_SHOWS_PER_STAGE_AND_DAY;
  return PERF_DAYS.flatMap((_, d) =>
    Array.from({ length: perDay }, (_, j) => {
      const n = (index * 3 + j * 5) % showsPerDay;
      return `perf-${d}-${n % PERF_STAGES.length}-${Math.floor(n / PERF_STAGES.length)}`;
    }),
  );
}

export async function seedPerformanceFixture() {
  await importLineup(perfLineupCsv(), { festivalDays: PERF_DAYS, allowDeletions: true });

  const members = [];
  for (let i = 0; i < PERF_MEMBERS; i++) {
    const username = `perf${String(i + 1).padStart(2, "0")}`;
    const login = await loginWithPin({ username, pin: PERF_PIN });
    if (login.status !== "ok") throw new Error(`cannot create ${username}: ${login.status}`);
    members.push({ id: login.userId, username });
  }

  const [owner, ...rest] = members;
  const group = await createGroup(owner.id, "Grupo de rendimiento");
  if (group.status !== "ok") throw new Error(`cannot create group: ${group.status}`);
  for (const member of rest) {
    const sent = await invite(owner.id, member.username);
    if (sent.status !== "ok") throw new Error(`cannot invite ${member.username}: ${sent.status}`);
    const accepted = await acceptInvitation(member.id, sent.invitationId);
    if (accepted.status !== "ok") throw new Error(`cannot accept ${member.username}: ${accepted.status}`);
  }

  for (const [index, member] of members.entries()) {
    for (const showId of perfSelectionsOf(index)) await setSelection(member.id, showId, true);
  }
  return { groupId: group.groupId, members };
}
