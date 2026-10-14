import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "@/components/avatar/Avatar";
import { AVATAR_SHAPES } from "@/domain/avatar";

describe("Avatar (FR-021)", () => {
  it("draws each of the 6 shapes differently", () => {
    const { container } = render(
      <>
        {AVATAR_SHAPES.map((shape) => (
          <Avatar key={shape} shape={shape} color="violet" />
        ))}
      </>,
    );

    const drawings = [...container.querySelectorAll("svg")].map((svg) => svg.innerHTML);
    expect(new Set(drawings).size).toBe(6);
  });

  it("uses the palette color and an accessible Spanish label", () => {
    render(<Avatar shape="hexagon" color="emerald" />);

    const avatar = screen.getByRole("img", { name: "Avatar: hexágono esmeralda" });
    expect(avatar.querySelector("[fill]")?.getAttribute("fill")).toBe("#10b981");
  });
});

describe("decorative Avatar", () => {
  it("is hidden from assistive technology so it does not pollute nearby labels", () => {
    render(
      <label>
        <input type="radio" name="shape" />
        <Avatar shape="star" color="emerald" decorative />
        estrella
      </label>,
    );

    expect(screen.getByRole("radio", { name: "estrella" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
