"use client";

export default function GridError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 p-8 text-center">
      <p>No se pudo cargar la grilla.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-neutral-600 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        Reintentar
      </button>
    </div>
  );
}
