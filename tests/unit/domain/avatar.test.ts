import { describe, expect, it } from "vitest";
import { AVATAR_SHAPES, randomAvatar } from "@/domain/avatar";
import { AVATAR_COLORS } from "@/domain/palettes";

describe("randomAvatar", () => {
  it("offers 6 shapes", () => {
    expect(AVATAR_SHAPES).toEqual(["circle", "square", "triangle", "diamond", "star", "hexagon"]);
  });

  it("picks a shape and a color from the fixed sets", () => {
    const colors = AVATAR_COLORS.map((c) => c.name);
    for (let i = 0; i < 50; i++) {
      const avatar = randomAvatar();
      expect(AVATAR_SHAPES).toContain(avatar.avatarShape);
      expect(colors).toContain(avatar.avatarColor);
    }
  });

  it("uses the injected random source", () => {
    expect(randomAvatar(() => 0)).toEqual({ avatarShape: "circle", avatarColor: "violet" });
    expect(randomAvatar(() => 0.999)).toEqual({ avatarShape: "hexagon", avatarColor: "blue" });
  });
});
