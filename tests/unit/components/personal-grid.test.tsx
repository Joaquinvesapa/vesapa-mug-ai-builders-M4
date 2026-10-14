import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonalDayGrid } from "@/components/grid/PersonalDayGrid";
import { buildDayView } from "@/domain/grid-view";
import { festivalTimeToInstant } from "@/domain/time";

const DAY = "2026-11-21";
const at = (time: string) => festivalTimeToInstant(DAY, time);
const STAGES = ["Norte", "Sur"].map((name, position) => ({ id: name, name, position }));
const SHOWS = [
  { id: "a", artist: "Los Cardos", description: "Rock", stageId: "Norte", startsAt: at("18:00"), endsAt: at("19:00") },
  { id: "b", artist: "Trío Pampa", description: "Jazz", stageId: "Sur", startsAt: at("18:30"), endsAt: at("19:30") },
  { id: "c", artist: "Las Brujas", description: "Cumbia", stageId: "Norte", startsAt: at("19:00"), endsAt: at("20:00") },
];
const VIEW = buildDayView(DAY, STAGES, SHOWS);
const block = (artist: string) => screen.getByRole("button", { name: new RegExp(`^${artist},`) });

function renderGrid({ selected = [] as string[], serverNow = at("17:58"), setSelected = vi.fn(async () => {}) } = {}) {
  render(<PersonalDayGrid view={VIEW} initialSelectedIds={selected} serverNow={serverNow.toISOString()} setSelected={setSelected} />);
  return { setSelected };
}

beforeEach(() => {
  vi.useFakeTimers();
  // The device clock is deliberately wrong by many hours (AC-84).
  vi.setSystemTime(new Date("2026-11-21T03:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("PersonalDayGrid", () => {
  it("toggles a block with a tap and persists the change (AC-36, AC-38)", async () => {
    const { setSelected } = renderGrid();

    await act(async () => fireEvent.click(block("Los Cardos")));
    expect(block("Los Cardos")).toHaveAttribute("aria-pressed", "true");
    expect(setSelected).toHaveBeenLastCalledWith("a", true);

    await act(async () => fireEvent.click(block("Los Cardos")));
    expect(block("Los Cardos")).toHaveAttribute("aria-pressed", "false");
    expect(setSelected).toHaveBeenLastCalledWith("a", false);
  });

  it("adds and removes from the detail (AC-37, AC-39)", async () => {
    const { setSelected } = renderGrid();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Las Brujas" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Agregar a mi grilla" })));
    expect(setSelected).toHaveBeenLastCalledWith("c", true);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Quitar de mi grilla" })));
    expect(setSelected).toHaveBeenLastCalledWith("c", false);
  });

  it("highlights exactly the selected blocks (AC-40)", () => {
    renderGrid({ selected: ["a", "c"] });

    const pressed = screen.getAllByRole("button", { pressed: true });
    expect(pressed.map((b) => b.getAttribute("aria-label")?.split(",")[0])).toEqual(["Los Cardos", "Las Brujas"]);
  });

  it("warns about overlapping selections naming both, keeping both selected (AC-41, AC-43, FR-092)", () => {
    renderGrid({ selected: ["a", "b"] });

    expect(screen.getByRole("status")).toHaveTextContent("Se superponen Los Cardos y Trío Pampa");
    expect(within(block("Los Cardos").parentElement!).getByLabelText("Se superpone")).toBeInTheDocument();
    expect(block("Trío Pampa")).toHaveAttribute("aria-pressed", "true");
  });

  it("does not warn about contiguous shows (AC-42)", () => {
    renderGrid({ selected: ["a", "c"] });

    expect(screen.queryByText(/Se superponen/)).toBeNull();
  });

  it("shows the server-based status and updates it without reload within 60 s (AC-84, AC-85, AC-86)", () => {
    renderGrid({ selected: ["a"], serverNow: at("17:59") });
    expect(block("Los Cardos")).toHaveAccessibleName(/próximo$/);

    act(() => vi.advanceTimersByTime(60_000));
    expect(block("Los Cardos")).toHaveAccessibleName(/en vivo$/);

    act(() => vi.advanceTimersByTime(60 * 60_000));
    expect(block("Los Cardos")).toHaveAccessibleName(/finalizado$/);
  });

  it("shows statuses only on the person's own shows (FR-093)", () => {
    renderGrid({ selected: ["a"], serverNow: at("18:10") });

    expect(block("Trío Pampa")).not.toHaveAccessibleName(/(próximo|en vivo|finalizado)$/);
  });

  it("reverts and reports when saving fails", async () => {
    renderGrid({ setSelected: vi.fn(async () => Promise.reject(new Error("boom"))) });

    await act(async () => fireEvent.click(block("Los Cardos")));

    expect(block("Los Cardos")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar el cambio");
  });
});
