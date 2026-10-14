import { requireApiUser } from "@/server/session";

/** Authoritative server instant; clients derive their clock offset from it. */
export async function GET(request: Request) {
  const { response } = await requireApiUser(request);
  if (response) return response;
  return Response.json({ now: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
