import type { AvatarColor, AvatarShape } from "@/generated/prisma/enums";
import { AVATAR_COLORS } from "@/domain/palettes";

export const AVATAR_SHAPES = ["circle", "square", "triangle", "diamond", "star", "hexagon"] as const satisfies readonly AvatarShape[];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

/** Every new account gets a random shape and color (FR-021). */
export function randomAvatar(random: () => number = Math.random): { avatarShape: AvatarShape; avatarColor: AvatarColor } {
  return {
    avatarShape: pick(AVATAR_SHAPES, random),
    avatarColor: pick(AVATAR_COLORS, random).name as AvatarColor,
  };
}
