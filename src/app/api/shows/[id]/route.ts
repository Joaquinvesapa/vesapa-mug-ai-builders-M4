import { getShowDetail } from "@/server/lineup";
import { requireApiUser } from "@/server/session";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiUser(request);
  if (response) return response;

  const show = await getShowDetail((await params).id);
  if (!show) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(show, { headers: { "Cache-Control": "private, no-store" } });
}
