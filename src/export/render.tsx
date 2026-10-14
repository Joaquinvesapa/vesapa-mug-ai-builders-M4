import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import type { ExportScene } from "@/export/export-scene";
import { EXPORT_BACKGROUND, GridImage } from "@/export/GridImage";

type SatoriFont = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };

let fonts: Promise<SatoriFont[]> | undefined;
const loadFont = (file: string) => readFile(path.join(process.cwd(), "public", "fonts", file));

function exportFonts() {
  fonts ??= Promise.all([
    loadFont("AtkinsonHyperlegible-Regular.ttf"),
    loadFont("AtkinsonHyperlegible-Bold.ttf"),
  ]).then(([regular, bold]) => [
    { name: "Atkinson", data: regular, weight: 400, style: "normal" },
    { name: "Atkinson", data: bold, weight: 700, style: "normal" },
  ]);
  return fonts;
}

/** Scene → SVG (Satori) → PNG (resvg), generated per request and never stored. */
export async function renderExport(scene: ExportScene) {
  const { width, height } = scene.layout.canvas;
  const svg = await satori(<GridImage scene={scene} />, { width, height, fonts: await exportFonts() });
  const image = new Resvg(svg, { fitTo: { mode: "original" }, background: EXPORT_BACKGROUND }).render();
  return { png: image.asPng(), width: image.width, height: image.height, pixels: image.pixels };
}
