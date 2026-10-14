import { EXPORT_MARGIN, EXPORT_STAGE_ROW, EXPORT_TEXT } from "@/export/export-layout";
import type { ExportScene } from "@/export/export-scene";

export const EXPORT_BACKGROUND = "#0a0a0a";
const DIMMED_ALPHA = 0.35;

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Satori template of the day grid; draws only the strings decided by the scene. */
export function GridImage({ scene }: { scene: ExportScene }) {
  const { layout } = scene;
  const bottom = layout.grid.y + layout.grid.height;

  return (
    <div
      style={{
        width: layout.canvas.width,
        height: layout.canvas.height,
        display: "flex",
        position: "relative",
        backgroundColor: EXPORT_BACKGROUND,
        color: "#ededed",
        fontFamily: "Atkinson",
      }}
    >
      <div style={{ position: "absolute", left: EXPORT_MARGIN, top: EXPORT_MARGIN, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 36, fontWeight: 700 }}>{scene.header.title}</div>
        <div style={{ fontSize: 24, color: "#d4d4d4", marginTop: 6 }}>{scene.header.subtitle}</div>
      </div>

      {layout.columns.map((column) => (
        <div
          key={column.name}
          style={{
            position: "absolute",
            left: column.x,
            top: column.y,
            width: column.width,
            height: EXPORT_STAGE_ROW,
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box",
            paddingLeft: 6,
            paddingRight: 6,
            borderTop: `4px solid ${column.colorHex}`,
            fontSize: 20,
            fontWeight: 700,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {column.name}
        </div>
      ))}

      {layout.columns.map((column) => (
        <div
          key={`line-${column.name}`}
          style={{
            position: "absolute",
            left: column.x,
            top: layout.bodyY,
            width: 1,
            height: bottom - layout.bodyY,
            backgroundColor: "#262626",
          }}
        />
      ))}

      {layout.hourMarks.map((mark) => (
        <div
          key={mark.label + mark.y}
          style={{
            position: "absolute",
            left: layout.axis.x,
            top: mark.y - 10,
            width: layout.axis.width - 6,
            display: "flex",
            justifyContent: "flex-end",
            fontSize: 16,
            color: "#a3a3a3",
          }}
        >
          {mark.label}
        </div>
      ))}

      {scene.blocks.map((block) => (
        <div
          key={block.showId}
          style={{
            position: "absolute",
            left: block.x,
            top: block.y,
            width: block.width,
            height: block.height,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            padding: EXPORT_TEXT.padding,
            paddingRight: block.highlighted ? 26 : EXPORT_TEXT.padding,
            borderRadius: 6,
            overflow: "hidden",
            backgroundColor: block.highlighted ? block.block.colorHex : rgba(block.block.colorHex, DIMMED_ALPHA),
            border: block.highlighted ? "2px solid #ffffff" : "none",
            color: block.highlighted ? "#0a0a0a" : "#ffffff",
          }}
        >
          {block.lines.map((line) => (
            <div
              key={line.kind}
              style={{
                fontSize: line.fontPx,
                lineHeight: `${line.lineHeight}px`,
                fontWeight: line.kind === "artist" ? 700 : 400,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {line.text}
            </div>
          ))}
          {block.highlighted && (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              style={{ position: "absolute", top: 4, right: 4 }}
            >
              <path d="M4 12l5 5L20 6" stroke="#0a0a0a" strokeWidth="3" fill="none" />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}
