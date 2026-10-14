import { requireApiUser } from "@/server/session";
import { searchUsers } from "@/server/users";

export async function GET(request: Request) {
  const { user, response } = await requireApiUser(request);
  if (response) return response;

  const results = await searchUsers(user.id, new URL(request.url).searchParams.get("q") ?? "");
  if (!results) return Response.json({ error: "query_too_short" }, { status: 400 });
  return Response.json(results, { headers: { "Cache-Control": "private, no-store" } });
}
