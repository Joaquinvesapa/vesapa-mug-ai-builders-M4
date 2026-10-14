export type PaletteColor = { name: string; hex: string };

/** Stage colors by order of appearance in the line-up (FR-032). */
export const STAGE_COLORS: readonly PaletteColor[] = [
  { name: "violet", hex: "#8b5cf6" },
  { name: "fuchsia", hex: "#d946ef" },
  { name: "amber", hex: "#f59e0b" },
  { name: "emerald", hex: "#10b981" },
  { name: "sky", hex: "#0ea5e9" },
];

/** Avatar colors (FR-021); names match the AvatarColor enum. */
export const AVATAR_COLORS: readonly PaletteColor[] = [
  { name: "violet", hex: "#8b5cf6" },
  { name: "fuchsia", hex: "#d946ef" },
  { name: "pink", hex: "#ec4899" },
  { name: "orange", hex: "#f97316" },
  { name: "amber", hex: "#f59e0b" },
  { name: "emerald", hex: "#10b981" },
  { name: "sky", hex: "#0ea5e9" },
  { name: "blue", hex: "#3b82f6" },
];

export function stageColor(position: number): PaletteColor {
  const color = STAGE_COLORS[position];
  if (!Number.isInteger(position) || !color) throw new Error(`Invalid stage position: ${position}`);
  return color;
}
