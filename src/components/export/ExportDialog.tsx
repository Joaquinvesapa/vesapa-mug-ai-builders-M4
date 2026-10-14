"use client";

import { useEffect, useId, useRef, useState } from "react";
import { inputClass, primaryButton, secondaryButton } from "@/components/ui";
import { formatFestivalDay } from "@/domain/festival-days";

const FORMATS = [
  { value: "1080x1920", label: "Historia (1080 × 1920)" },
  { value: "1080x1350", label: "Publicación (1080 × 1350)" },
] as const;

type Props = { kind: "personal" | "group"; days: readonly string[]; currentDay: string };

/** Picks day, format and (group only) the explicit names option, then downloads the PNG (FR-070, FR-073). */
export function ExportDialog({ kind, days, currentDay }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const firstField = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!open) return;
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={secondaryButton}>
        Exportar imagen
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-xl bg-neutral-900 p-5"
          >
            <h2 id={titleId} className="text-xl font-bold">
              Exportar imagen
            </h2>
            {/* Close after the browser has started the download; unmounting during submit would cancel it. */}
            <form method="get" action="/api/export" onSubmit={() => window.setTimeout(() => setOpen(false))} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="kind" value={kind} />
              <label className="flex flex-col gap-1">
                <span>Día</span>
                <select ref={firstField} name="day" defaultValue={currentDay} className={inputClass}>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {formatFestivalDay(day)}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1">Formato</legend>
                {FORMATS.map((format, index) => (
                  <label key={format.value} className="flex items-center gap-2">
                    <input type="radio" name="format" value={format.value} defaultChecked={index === 0} />
                    {format.label}
                  </label>
                ))}
              </fieldset>
              {kind === "group" && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="names" value="1" />
                  Incluir nombres de quienes coinciden
                </label>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className={secondaryButton}>
                  Cancelar
                </button>
                <button type="submit" className={primaryButton}>
                  Descargar PNG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
