import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/export/route";
import { buildExportScene, type ExportRequest } from "@/export/export-scene";
import { renderExport } from "@/export/render";
import { setSelection } from "@/server/selection";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";
import { groupWith } from "../support/groups";
import { importFixture } from "../support/lineup";

withCleanDb();

const DAY = "2026-11-21";
const personal = (overrides: Partial<ExportRequest> = {}): ExportRequest => ({
  kind: "personal",
  day: DAY,
  format: "1080x1920",
  includeNames: false,
  ...overrides,
});

/** Width and height from the PNG IHDR chunk. */
function pngSize(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect([...bytes.slice(1, 4)].map((c) => String.fromCharCode(c)).join("")).toBe("PNG");
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const BACKGROUND = hexToRgb("#0a0a0a");
const dimmed = (hex: string) => hexToRgb(hex).map((c, i) => Math.round(0.35 * c + 0.65 * BACKGROUND[i]));

function pixelAt(image: { pixels: Uint8Array; width: number }, x: number, y: number) {
  const offset = (Math.round(y) * image.width + Math.round(x)) * 4;
  return [...image.pixels.slice(offset, offset + 3)];
}

const close = (actual: number[], expected: number[]) =>
  actual.every((value, i) => Math.abs(value - expected[i]) <= 4);

const textOf = (scene: Awaited<ReturnType<typeof buildExportScene>>, showId: string) =>
  scene!.blocks.find((b) => b.showId === showId)!.lines.map((l) => l.text);

async function personWithSelections(username: string, ...showIds: string[]) {
  const user = await createUser(username);
  for (const id of showIds) await setSelection(user.id, id, true);
  return user;
}

describe("export scene", () => {
  it("contains the 8 shows of the day with exactly the 2 selected highlighted (AC-89)", async () => {
    await importFixture("export.csv");
    const ana = await personWithSelections("ana", "x2", "x6");

    const scene = await buildExportScene(ana.id, personal());

    expect(scene!.blocks).toHaveLength(8);
    expect(scene!.blocks.filter((b) => b.highlighted).map((b) => b.showId).sort()).toEqual(["x2", "x6"]);
  });

  it("paints the selected shows with their full stage color and dims the rest (AC-89, FR-041)", async () => {
    await importFixture("export.csv");
    const ana = await personWithSelections("ana", "x2", "x6");
    const scene = (await buildExportScene(ana.id, personal()))!;

    const image = await renderExport(scene);

    for (const block of scene.blocks) {
      const color = pixelAt(image, block.x + block.width - 10, block.y + block.height - 10);
      const expected = block.highlighted ? hexToRgb(block.block.colorHex) : dimmed(block.block.colorHex);
      expect(close(color, expected), `${block.showId}: ${color} vs ${expected}`).toBe(true);
    }
  });

  it("keeps every block within its own slot, so neighbours are never covered (FR-071)", async () => {
    await importFixture("export.csv");
    const ana = await personWithSelections("ana", "x6");
    const scene = (await buildExportScene(ana.id, personal({ format: "1080x1350" })))!;
    const image = await renderExport(scene);

    // x6 (Norte, 20:00-21:00) has no show to its right nor below it.
    const x6 = scene.blocks.find((b) => b.showId === "x6")!;
    expect(close(pixelAt(image, x6.x + x6.width + 3, x6.y + x6.height / 2), BACKGROUND)).toBe(true);
    expect(close(pixelAt(image, x6.x + x6.width / 2, x6.y + x6.height + 3), BACKGROUND)).toBe(true);
    expect(close(pixelAt(image, x6.x + x6.width - 3, x6.y + x6.height - 3), hexToRgb(x6.block.colorHex)) ||
      close(pixelAt(image, x6.x + x6.width - 3, x6.y + x6.height - 3), [255, 255, 255])).toBe(true);
  });

  it("titles the image with the festival and the day, without temporal statuses (FR-070, FR-093)", async () => {
    await importFixture("export.csv");
    const ana = await personWithSelections("ana", "x1");

    const scene = (await buildExportScene(ana.id, personal()))!;

    expect(scene.header).toEqual({ title: "Festival de demostración", subtitle: "sábado 21 de noviembre" });
    expect(scene.fileName).toBe("grilla-personal-2026-11-21-1080x1920.png");
    const allText = scene.blocks.flatMap((b) => b.lines.map((l) => l.text)).join(" ");
    expect(allText).not.toMatch(/próximo|en vivo|finalizado/);
    expect(textOf(scene, "x1")).toEqual(["Artista X1", "18:00–19:00"]);
  });

  it("includes all 40 shows of a busy day (AC-95)", async () => {
    await importFixture("export.csv");
    const ana = await createUser("ana");

    const scene = (await buildExportScene(ana.id, personal({ day: "2026-11-22", format: "1080x1350" })))!;
    const image = await renderExport(scene);

    expect(scene.blocks).toHaveLength(40);
    expect([image.width, image.height]).toEqual([1080, 1350]);
  });

  describe("group export", () => {
    async function setup() {
      await importFixture("export.csv");
      const { owner, members } = await groupWith("ana", ["beto", "caro"]);
      const [beto, caro] = members;
      for (const user of [owner, beto, caro]) await setSelection(user.id, "x1", true);
      await setSelection(owner.id, "x2", true);
      await setSelection(beto.id, "x2", true);
      await setSelection(owner.id, "x3", true);
      await setSelection(beto.id, "x4", true);
      await setSelection(caro.id, "x4", true);
      return { ana: owner, beto, caro };
    }
    const group = (includeNames: boolean): ExportRequest => personal({ kind: "group", includeNames });

    it("highlights only the requester's shows and adds the group name to the title (AC-90, FR-070)", async () => {
      const { ana } = await setup();

      const scene = (await buildExportScene(ana.id, group(false)))!;

      expect(scene.blocks.filter((b) => b.highlighted).map((b) => b.showId).sort()).toEqual(["x1", "x2", "x3"]);
      expect(scene.header.subtitle).toBe("sábado 21 de noviembre · Grupo de ana");
      expect(scene.fileName).toBe("grilla-grupo-2026-11-21-1080x1920.png");
    });

    it("shows the group count on the requester's shows only (AC-91, FR-073)", async () => {
      const { ana } = await setup();

      const scene = (await buildExportScene(ana.id, group(false)))!;

      expect(textOf(scene, "x1")).toContain("3 del grupo");
      expect(textOf(scene, "x4").join(" ")).not.toMatch(/del grupo/);
    });

    it("shows names only when requested and only for shows chosen by at least 2 (AC-92, AC-93)", async () => {
      const { ana } = await setup();

      const scene = (await buildExportScene(ana.id, group(true)))!;

      expect(textOf(scene, "x2")).toContain("ana, beto");
      expect(textOf(scene, "x3").join(" ")).not.toMatch(/ana/);
    });

    it("shows no names at all when the option is off (AC-94)", async () => {
      const { ana } = await setup();

      const scene = (await buildExportScene(ana.id, group(false)))!;

      expect(scene.blocks.flatMap((b) => b.lines.filter((l) => l.kind === "names"))).toEqual([]);
    });

    it("is unavailable to someone outside the group (AC-104)", async () => {
      await setup();
      const zoe = await createUser("zoe");

      expect(await buildExportScene(zoe.id, group(true))).toBeNull();
    });
  });
});

describe("GET /api/export", () => {
  const call = (query: string, token?: string) => GET(requestWithSession(`/api/export?${query}`, token));

  it.each([
    ["1080x1920", 1080, 1920],
    ["1080x1350", 1080, 1350],
  ])("returns a %s PNG with download headers (AC-87, AC-88)", async (format, width, height) => {
    await importFixture("export.csv");
    const ana = await personWithSelections("ana", "x1");

    const response = await call(`kind=personal&day=${DAY}&format=${format}`, await createSession(ana.id));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toBe(`attachment; filename="grilla-personal-${DAY}-${format}.png"`);
    expect(pngSize(new Uint8Array(await response.arrayBuffer()))).toEqual({ width, height });
  });

  it("returns the group PNG in each format to a member (AC-90)", async () => {
    await importFixture("export.csv");
    const { owner } = await groupWith("ana", ["beto"]);
    const token = await createSession(owner.id);

    for (const [format, height] of [["1080x1920", 1920], ["1080x1350", 1350]] as const) {
      const response = await call(`kind=group&day=${DAY}&format=${format}&names=1`, token);
      expect(response.status).toBe(200);
      expect(pngSize(new Uint8Array(await response.arrayBuffer()))).toEqual({ width: 1080, height });
    }
  });

  it("denies the group export to someone outside a group (AC-104)", async () => {
    await importFixture("export.csv");
    await groupWith("ana", ["beto"]);
    const zoe = await createUser("zoe");

    const response = await call(`kind=group&day=${DAY}&format=1080x1920`, await createSession(zoe.id));

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it.each(["kind=otro&day=2026-11-21&format=1080x1920", "kind=personal&day=2030-01-01&format=1080x1920", "kind=personal&day=2026-11-21&format=800x600"])(
    "rejects invalid parameters: %s",
    async (query) => {
      const ana = await createUser("ana");

      expect((await call(query, await createSession(ana.id))).status).toBe(400);
    },
  );
});
