import http from "k6/http";

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const SESSION_COOKIE = "authjs.session-token";

/** Written by scripts/seed-perf.mts: festival days, test PIN and fixture usernames. */
export const fixture = JSON.parse(open("/results/fixture.json"));

/** Signs in with the fixture PIN and returns the session token. */
export function login(username) {
  const res = http.post(`${BASE_URL}/api/auth/pin`, JSON.stringify({ username, pin: fixture.pin }), {
    headers: { "Content-Type": "application/json" },
    tags: { phase: "setup" },
  });
  const token = res.cookies[SESSION_COOKIE] && res.cookies[SESSION_COOKIE][0].value;
  if (res.status !== 200 || !token) throw new Error(`login ${username} failed: ${res.status}`);
  return token;
}

export const withSession = (token, extra = {}) => ({ cookies: { [SESSION_COOKIE]: token }, ...extra });
