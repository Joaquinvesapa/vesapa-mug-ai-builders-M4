"use client";

import { useEffect, useState } from "react";
import { serverNow } from "@/domain/show-status";

export const TICK_MS = 15_000;
export const RESYNC_MS = 5 * 60_000;

async function fetchServerInstant(): Promise<string> {
  const response = await fetch("/api/time", { cache: "no-store" });
  if (!response.ok) throw new Error(`time ${response.status}`);
  return ((await response.json()) as { now: string }).now;
}

/**
 * Authoritative clock: the device clock corrected by its offset against the server,
 * re-evaluated every 15 s and re-synchronized every 5 min (FR-043, FR-044).
 */
export function useServerClock(initialServerNow: string, fetchNow: () => Promise<string> = fetchServerInstant): Date {
  const [offset, setOffset] = useState(() => Date.parse(initialServerNow) - Date.now());
  const [now, setNow] = useState(() => serverNow(offset));

  useEffect(() => {
    const tick = window.setInterval(() => setNow(serverNow(offset)), TICK_MS);
    return () => window.clearInterval(tick);
  }, [offset]);

  useEffect(() => {
    const resync = window.setInterval(async () => {
      try {
        const next = Date.parse(await fetchNow()) - Date.now();
        setOffset(next);
        setNow(serverNow(next));
      } catch {
        // Keep the last known offset; the next resync will retry.
      }
    }, RESYNC_MS);
    return () => window.clearInterval(resync);
  }, [fetchNow]);

  return now;
}
