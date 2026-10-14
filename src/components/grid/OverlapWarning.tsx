import type { Overlap } from "@/domain/overlap";

export function OverlapWarning({ overlaps }: { overlaps: Overlap[] }) {
  if (overlaps.length === 0) return null;
  return (
    <div role="status" className="mx-4 mb-2 rounded-lg border border-amber-500 bg-amber-950 px-3 py-2 text-amber-100">
      <span aria-hidden="true">⚠ </span>
      {overlaps.map((o, i) => (
        <span key={`${o.first.id}-${o.second.id}`}>
          {i > 0 && "; "}
          Se superponen {o.first.artist} y {o.second.artist}
        </span>
      ))}
    </div>
  );
}
