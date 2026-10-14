import { FESTIVAL_TIME_ZONE } from "../src/domain/time";

export type FestivalConfig = {
  name: string;
  country: "AR";
  timeZone: typeof FESTIVAL_TIME_ZONE;
  /** Festival days (YYYY-MM-DD) in ascending order. */
  days: readonly string[];
};

// Demo values until the owner provides the real festival for this deployment.
export const festival: FestivalConfig = {
  name: "Festival de demostración",
  country: "AR",
  timeZone: FESTIVAL_TIME_ZONE,
  days: ["2026-11-20", "2026-11-21", "2026-11-22"],
};
