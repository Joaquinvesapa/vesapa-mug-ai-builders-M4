import Link from "next/link";
import { formatFestivalDayShort } from "@/domain/festival-days";

export function DaySelector({ days, current, basePath }: { days: readonly string[]; current: string; basePath: string }) {
  return (
    <nav aria-label="Días del festival" className="flex gap-2 overflow-x-auto px-4 py-2">
      {days.map((day) => (
        <Link
          key={day}
          href={`${basePath}/${day}`}
          aria-current={day === current ? "page" : undefined}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            day === current ? "bg-white text-neutral-950" : "border border-neutral-600"
          }`}
        >
          {formatFestivalDayShort(day)}
        </Link>
      ))}
    </nav>
  );
}
