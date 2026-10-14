export function GridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando la grilla" className="flex gap-2 px-4 py-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-[60dvh] w-[140px] shrink-0 animate-pulse rounded-md bg-neutral-800" />
      ))}
    </div>
  );
}
