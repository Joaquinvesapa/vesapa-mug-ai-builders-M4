"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { BlockView } from "@/domain/grid-view";

type Props = { block: BlockView; dayLabel: string; onClose: () => void; children?: ReactNode };

export function ShowDetail({ block, dayLabel, onClose, children }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-xl border-t-4 bg-neutral-900 p-5"
        style={{ borderTopColor: block.colorHex }}
      >
        <h2 id={titleId} className="text-xl font-bold">
          {block.artist}
        </h2>
        <p className="mt-2 text-neutral-300">{block.description}</p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-neutral-400">Día</dt>
          <dd>{dayLabel}</dd>
          <dt className="text-neutral-400">Escenario</dt>
          <dd>{block.stageName}</dd>
          <dt className="text-neutral-400">Inicio</dt>
          <dd>{block.startLabel}</dd>
          <dt className="text-neutral-400">Finalización</dt>
          <dd>{block.endLabel}</dd>
        </dl>
        <div className="mt-5 flex justify-end gap-3">
          {children}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-600 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
