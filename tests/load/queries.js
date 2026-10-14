// RNF-01 / AC-97: 30 warm-up requests per operation, then 300 measured with exactly 10
// authenticated users; p95 of each operation must stay below 2 s.
//
// The line-up and the personal grid are served by the same page (/grilla/[day]): it renders
// the day's line-up with the person's selections. Their 100 + 100 requests are measured
// together as "grid"; the group view (/grupo/vista/[day]) is measured on its own.
import { check } from "k6";
import exec from "k6/execution";
import http from "k6/http";
import { Trend } from "k6/metrics";
import { BASE_URL, fixture, login, withSession } from "./common.js";

const USERS = 10;
const OPERATIONS = ["grid", "grid", "group_view"];
const WARMUP = 30 * OPERATIONS.length;
const MEASURED = 100 * OPERATIONS.length;
const P95_MS = Number(__ENV.QUERY_P95_MS || 2000);

const durations = {
  grid: new Trend("grid_duration", true),
  group_view: new Trend("group_view_duration", true),
};

export const options = {
  scenarios: {
    queries: { executor: "shared-iterations", vus: USERS, iterations: WARMUP + MEASURED, maxDuration: "10m" },
  },
  thresholds: {
    grid_duration: [`p(95)<${P95_MS}`],
    group_view_duration: [`p(95)<${P95_MS}`],
    "checks{phase:measured}": ["rate==1"],
  },
  summaryTrendStats: ["count", "min", "med", "avg", "p(95)", "max"],
};

export function setup() {
  return fixture.usernames.slice(0, USERS).map(login);
}

export default function queriesRun(tokens) {
  const i = exec.scenario.iterationInTest;
  const operation = OPERATIONS[i % OPERATIONS.length];
  const day = fixture.days[Math.floor(i / OPERATIONS.length) % fixture.days.length];
  const phase = i < WARMUP ? "warmup" : "measured";
  const token = tokens[(exec.vu.idInTest - 1) % tokens.length];
  const path = operation === "grid" ? `/grilla/${day}` : `/grupo/vista/${day}`;

  const res = http.get(`${BASE_URL}${path}`, withSession(token, { tags: { operation, phase } }));

  check(res, { "200 with the day grid": (r) => r.status === 200 && r.body.includes('role="columnheader"') }, { phase });
  if (phase === "measured") durations[operation].add(res.timings.duration);
}
