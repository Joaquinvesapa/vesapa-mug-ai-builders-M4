import { festival } from "@config/festival";
import { getGroupView } from "@/server/groups/group-view";
import { requireApiUser } from "@/server/session";

export async function GET(request: Request) {
  const { user, response } = await requireApiUser(request);
  if (response) return response;

  const day = new URL(request.url).searchParams.get("day") ?? "";
  if (!festival.days.includes(day)) return Response.json({ error: "invalid_day" }, { status: 400 });

  const view = await getGroupView(user.id, day);
  if (!view) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ day: view.day, shows: view.shows }, { headers: { "Cache-Control": "private, no-store" } });
}
