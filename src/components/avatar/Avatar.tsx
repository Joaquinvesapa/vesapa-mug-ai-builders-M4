import { COLOR_LABELS, SHAPE_LABELS } from "@/domain/avatar";
import { AVATAR_COLORS } from "@/domain/palettes";
import type { AvatarColor, AvatarShape } from "@/generated/prisma/enums";

const STAR = "12,1.5 14.9,8.6 22.5,9.2 16.7,14.1 18.5,21.5 12,17.5 5.5,21.5 7.3,14.1 1.5,9.2 9.1,8.6";

function Shape({ shape, fill }: { shape: AvatarShape; fill: string }) {
  switch (shape) {
    case "circle":
      return <circle cx="12" cy="12" r="10" fill={fill} />;
    case "square":
      return <rect x="3" y="3" width="18" height="18" rx="2" fill={fill} />;
    case "triangle":
      return <polygon points="12,2 22,21 2,21" fill={fill} />;
    case "diamond":
      return <polygon points="12,1 23,12 12,23 1,12" fill={fill} />;
    case "star":
      return <polygon points={STAR} fill={fill} />;
    case "hexagon":
      return <polygon points="12,1.5 21.5,6.75 21.5,17.25 12,22.5 2.5,17.25 2.5,6.75" fill={fill} />;
  }
}

/** Abstract avatar: one of 6 shapes in one of 8 palette colors; no uploaded images (FR-021). */
type Props = {
  shape: AvatarShape;
  color: AvatarColor;
  size?: number;
  /** Hides it from assistive technology when a nearby text already names it. */
  decorative?: boolean;
};

export function Avatar({ shape, color, size = 24, decorative = false }: Props) {
  const fill = AVATAR_COLORS.find((c) => c.name === color)?.hex ?? "#737373";
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : { role: "img", "aria-label": `Avatar: ${SHAPE_LABELS[shape]} ${COLOR_LABELS[color]}` };
  return (
    <svg {...a11y} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
      <Shape shape={shape} fill={fill} />
    </svg>
  );
}
