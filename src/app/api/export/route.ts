import { z } from "zod";
import { festival } from "@config/festival";
import { EXPORT_FORMATS, type ExportFormat } from "@/export/export-layout";
import { buildExportScene } from "@/export/export-scene";
import { renderExport } from "@/export/render";
import { requireApiUser } from "@/server/session";

const querySchema = z.object({
  kind: z.enum(["personal", "group"]),
  day: z.string().refine((day) => festival.days.includes(day)),
  format: z.enum(Object.keys(EXPORT_FORMATS) as [ExportFormat, ...ExportFormat[]]),
  names: z.enum(["0", "1"]).optional(),
});

export async function GET(request: Request) {
  const { user, response } = await requireApiUser(request);
  if (response) return response;

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "invalid_parameters" }, { status: 400 });
  const { kind, day, format, names } = parsed.data;

  const scene = await buildExportScene(user.id, { kind, day, format, includeNames: kind === "group" && names === "1" });
  if (!scene) return Response.json({ error: "not_found" }, { status: 404 });

  const { png } = await renderExport(scene);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${scene.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
