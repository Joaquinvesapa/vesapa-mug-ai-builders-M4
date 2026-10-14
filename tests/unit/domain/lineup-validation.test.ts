import { describe, expect, it } from "vitest";
import { parseLineup } from "@/domain/lineup-validation";

const DAYS = ["2026-11-21", "2026-11-22"];
const HEADER = "id,artist,description,day,stage,start,end";

function csv(...rows: string[]) {
  return [HEADER, ...rows].join("\n");
}

function expectErrors(text: string, fragment: string) {
  const result = parseLineup(text, DAYS);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.join("\n")).toContain(fragment);
}

describe("parseLineup", () => {
  it("parses shows and orders stages by first appearance", () => {
    const result = parseLineup(
      csv(
        "s1,Banda Uno,Rock,2026-11-21,Norte,20:00,21:00",
        "s2,Banda Dos,Pop,2026-11-21,Sur,20:30,21:30",
        "s3,Banda Tres,Jazz,2026-11-22,Norte,18:00,19:00",
      ),
      DAYS,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stages).toEqual([
      { name: "Norte", position: 0 },
      { name: "Sur", position: 1 },
    ]);
    expect(result.shows[0]).toEqual({
      id: "s1",
      artist: "Banda Uno",
      description: "Rock",
      festivalDay: "2026-11-21",
      stage: "Norte",
      startsAt: new Date("2026-11-21T23:00:00Z"),
      endsAt: new Date("2026-11-22T00:00:00Z"),
    });
  });

  it("keeps an after-midnight show on its festival day (AC-04, AC-107)", () => {
    const result = parseLineup(csv("s1,Cierre,Techno,2026-11-21,Norte,00:30,01:30"), DAYS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shows[0].festivalDay).toBe("2026-11-21");
    expect(result.shows[0].startsAt).toEqual(new Date("2026-11-22T03:30:00Z"));
  });

  it("rejects a show without stage (AC-03)", () => {
    expectErrors(csv("s1,Banda,Rock,2026-11-21,,20:00,21:00"), "línea 2");
  });

  it("rejects an empty required field", () => {
    expectErrors(csv(",Banda,Rock,2026-11-21,Norte,20:00,21:00"), "id");
    expectErrors(csv("s1,,Rock,2026-11-21,Norte,20:00,21:00"), "artist");
    expectErrors(csv("s1,Banda,,2026-11-21,Norte,20:00,21:00"), "description");
  });

  it("rejects malformed times and days", () => {
    expectErrors(csv("s1,Banda,Rock,2026-11-21,Norte,8pm,21:00"), "start");
    expectErrors(csv("s1,Banda,Rock,21/11/2026,Norte,20:00,21:00"), "day");
  });

  it("rejects a show whose end is not after its start", () => {
    expectErrors(csv("s1,Banda,Rock,2026-11-21,Norte,21:00,21:00"), "finalización");
    expectErrors(csv("s1,Banda,Rock,2026-11-21,Norte,22:00,07:00"), "finalización");
  });

  it("rejects duplicated ids", () => {
    expectErrors(csv("s1,A,Rock,2026-11-21,Norte,20:00,21:00", "s1,B,Pop,2026-11-21,Sur,20:00,21:00"), "repetido");
  });

  it("rejects days that are not configured festival days", () => {
    expectErrors(csv("s1,Banda,Rock,2026-11-23,Norte,20:00,21:00"), "no es un día del festival");
  });

  it("rejects more than 5 distinct stages (AC-109)", () => {
    const rows = ["A", "B", "C", "D", "E", "F"].map((stage, i) => `s${i},Banda ${i},Rock,2026-11-21,${stage},20:00,21:00`);
    expectErrors(csv(...rows), "5 escenarios");
  });

  it("rejects an unexpected header", () => {
    expectErrors("id,artist,day,stage,start,end\ns1,A,2026-11-21,Norte,20:00,21:00", "encabezado");
  });

  it("supports quoted fields with commas", () => {
    const result = parseLineup(csv('s1,"Banda, la",  "Rock, pop",2026-11-21,Norte,20:00,21:00'), DAYS);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.shows[0].description).toBe("Rock, pop");
  });
});
