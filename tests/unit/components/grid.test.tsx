import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DayGrid } from "@/components/grid/DayGrid";
import { buildDayView } from "@/domain/grid-view";
import { festivalTimeToInstant } from "@/domain/time";

const DAY = "2026-11-21";
const STAGES = ["Norte", "Sur", "Carpa", "Río", "Patio"].map((name, position) => ({ id: name, name, position }));
const at = (time: string) => festivalTimeToInstant(DAY, time);

const SHOWS = [
  { id: "a", artist: "Los Cardos", description: "Rock", stageId: "Norte", startsAt: at("18:00"), endsAt: at("19:00") },
  { id: "b", artist: "Mar de Fondo", description: "Pop", stageId: "Sur", startsAt: at("18:00"), endsAt: at("18:15") },
  { id: "c", artist: "Patio Final", description: "Folk", stageId: "Patio", startsAt: at("20:00"), endsAt: at("21:00") },
];

function renderGrid() {
  return render(<DayGrid view={buildDayView(DAY, STAGES, SHOWS)} />);
}

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

describe("DayGrid", () => {
  it("renders the 5 stage columns in order, each with a distinct color (AC-33)", () => {
    renderGrid();

    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(["Norte", "Sur", "Carpa", "Río", "Patio"]);
    const colors = headers.map((h) => h.style.borderTopColor);
    expect(new Set(colors).size).toBe(5);
    expect(colors[0]).toBe(rgb("#8b5cf6"));
  });

  it("paints every block with its stage color (AC-33)", () => {
    renderGrid();

    const block = screen.getByRole("button", { name: /^Los Cardos/ });
    expect(block.style.getPropertyValue("--stage-color")).toBe("#8b5cf6");
    expect(screen.getByRole("button", { name: /^Patio Final/ }).style.getPropertyValue("--stage-color")).toBe("#0ea5e9");
  });

  it("shows artist and times in a tall block and omits the time in a 15-minute block (FR-033)", () => {
    renderGrid();

    const tall = screen.getByRole("button", { name: /^Los Cardos/ });
    expect(within(tall).getByText("18:00–19:00")).toBeInTheDocument();
    const short = screen.getByRole("button", { name: /^Mar de Fondo/ });
    expect(within(short).getByText("Mar de Fondo")).toBeInTheDocument();
    expect(within(short).queryByText("18:00–18:15")).toBeNull();
  });

  it("names each block with artist, stage and times for assistive technology", () => {
    renderGrid();

    expect(screen.getByRole("button", { name: "Mar de Fondo, Sur, 18:00 a 18:15" })).toBeInTheDocument();
  });

  it("opens the detail from the 'Ver detalle' control (AC-35, FR-085)", () => {
    renderGrid();

    fireEvent.click(screen.getByRole("button", { name: "Ver detalle de Los Cardos" }));

    const dialog = screen.getByRole("dialog", { name: "Los Cardos" });
    expect(dialog).toHaveTextContent("Rock");
    expect(dialog).toHaveTextContent("Norte");
    expect(dialog).toHaveTextContent("18:00");
    expect(dialog).toHaveTextContent("19:00");
    expect(dialog).toHaveTextContent("sábado 21 de noviembre");

    fireEvent.click(within(dialog).getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
