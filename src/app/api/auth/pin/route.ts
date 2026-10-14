import { loginWithPin } from "@/server/auth/pin-service";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/server/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { username?: unknown; pin?: unknown } | null;
  const username = typeof body?.username === "string" ? body.username : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  const result = await loginWithPin({ username, pin });

  if (result.status === "invalid_format") return Response.json({ error: "invalid_format" }, { status: 400 });
  if (result.status === "invalid_credentials") return Response.json({ error: "invalid_credentials" }, { status: 401 });

  const secure = new URL(request.url).protocol === "https:";
  const name = secure ? `__Secure-${SESSION_COOKIE}` : SESSION_COOKIE;
  const cookie = [
    `${name}=${result.sessionToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_MS / 1000}`,
    ...(secure ? ["Secure"] : []),
  ].join("; ");

  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie, "Cache-Control": "no-store" } });
}
