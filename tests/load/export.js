// RNF-03 / AC-96: 5 warm-up exports per combination (personal/group × 1080x1920/1080x1350),
// then 100 measured (25 per combination) with exactly 2 users; p95 below 5 s.
import { check } from "k6";
import exec from "k6/execution";
import http from "k6/http";
import { Trend } from "k6/metrics";
import { BASE_URL, fixture, login, withSession } from "./common.js";

const USERS = 2;
const COMBINATIONS = [
  { kind: "personal", format: "1080x1920" },
  { kind: "personal", format: "1080x1350" },
  { kind: "group", format: "1080x1920" },
  { kind: "group", format: "1080x1350" },
];
const WARMUP = 5 * COMBINATIONS.length;
const MEASURED = 25 * COMBINATIONS.length;
const P95_MS = Number(__ENV.EXPORT_P95_MS || 5000);

const exportDuration = new Trend("export_duration", true);

export const options = {
  scenarios: {
    exports: { executor: "shared-iterations", vus: USERS, iterations: WARMUP + MEASURED, maxDuration: "15m" },
  },
  thresholds: {
    export_duration: [`p(95)<${P95_MS}`],
    "checks{phase:measured}": ["rate==1"],
  },
  summaryTrendStats: ["count", "min", "med", "avg", "p(95)", "max"],
};

export function setup() {
  return fixture.usernames.slice(0, USERS).map(login);
}

export default function exportRun(tokens) {
  const i = exec.scenario.iterationInTest;
  const { kind, format } = COMBINATIONS[i % COMBINATIONS.length];
  const day = fixture.days[Math.floor(i / COMBINATIONS.length) % fixture.days.length];
  const phase = i < WARMUP ? "warmup" : "measured";
  const token = tokens[(exec.vu.idInTest - 1) % tokens.length];
  const names = kind === "group" ? "&names=1" : "";

  const res = http.get(
    `${BASE_URL}/api/export?kind=${kind}&day=${day}&format=${format}${names}`,
    withSession(token, { responseType: "binary", tags: { kind, format, phase } }),
  );

  check(res, { "200 PNG": (r) => r.status === 200 && r.headers["Content-Type"] === "image/png" && r.body.byteLength > 0 }, { phase });
  if (phase === "measured") exportDuration.add(res.timings.duration);
}
