import { describe, expect, it } from "vitest";
import { AVATAR_COLORS, STAGE_COLORS, stageColor } from "@/domain/palettes";

describe("stage palette", () => {
  it("assigns violeta, fucsia, ámbar, esmeralda, celeste by order of appearance", () => {
    expect(STAGE_COLORS.map((c) => c.name)).toEqual(["violet", "fuchsia", "amber", "emerald", "sky"]);
    expect([0, 1, 2, 3, 4].map((p) => stageColor(p).name)).toEqual(["violet", "fuchsia", "amber", "emerald", "sky"]);
  });

  it("gives every stage a distinct color", () => {
    expect(new Set(STAGE_COLORS.map((c) => c.hex)).size).toBe(5);
  });

  it("rejects positions outside 0-4", () => {
    expect(() => stageColor(5)).toThrow();
    expect(() => stageColor(-1)).toThrow();
  });
});

describe("avatar palette", () => {
  it("offers the 8 avatar colors", () => {
    expect(AVATAR_COLORS.map((c) => c.name)).toEqual(["violet", "fuchsia", "pink", "orange", "amber", "emerald", "sky", "blue"]);
  });
});
