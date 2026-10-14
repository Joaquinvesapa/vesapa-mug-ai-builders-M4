import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { listSelectedShowIds, setSelection } from "@/server/selection";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";
import { importFixture } from "../support/lineup";

withCleanDb();

describe("personal selection", () => {
  it("adds a show idempotently (AC-36, AC-37)", async () => {
    await importFixture();
    const ana = await createUser("ana");

    expect(await setSelection(ana.id, "s1", true)).toEqual({ status: "ok", selected: true });
    expect(await setSelection(ana.id, "s1", true)).toEqual({ status: "ok", selected: true });

    expect(await db.selection.count({ where: { userId: ana.id } })).toBe(1);
  });

  it("removes a show without touching other people's selections (AC-38, AC-39)", async () => {
    await importFixture();
    const ana = await createUser("ana");
    const beto = await createUser("beto");
    await setSelection(ana.id, "s1", true);
    await setSelection(beto.id, "s1", true);

    expect(await setSelection(ana.id, "s1", false)).toEqual({ status: "ok", selected: false });

    expect(await listSelectedShowIds(ana.id, "2026-11-21")).toEqual([]);
    expect(await listSelectedShowIds(beto.id, "2026-11-21")).toEqual(["s1"]);
  });

  it("keeps both overlapping shows selected (AC-43)", async () => {
    await importFixture();
    const ana = await createUser("ana");

    await setSelection(ana.id, "s1", true);
    await setSelection(ana.id, "s2", true);

    expect(await listSelectedShowIds(ana.id, "2026-11-21")).toEqual(["s1", "s2"]);
  });

  it("lists only the selections of the requested day", async () => {
    await importFixture();
    const ana = await createUser("ana");
    await setSelection(ana.id, "s1", true);
    await setSelection(ana.id, "s5", true);

    expect(await listSelectedShowIds(ana.id, "2026-11-22")).toEqual(["s5"]);
  });

  it("rejects an unknown show", async () => {
    const ana = await createUser("ana");

    expect(await setSelection(ana.id, "nope", true)).toEqual({ status: "not_found" });
  });

  it("never exposes another person's personal grid (AC-101)", async () => {
    await importFixture();
    const ana = await createUser("ana");
    const beto = await createUser("beto");
    await setSelection(beto.id, "s1", true);
    await setSelection(beto.id, "s3", true);

    expect(await listSelectedShowIds(ana.id, "2026-11-21")).toEqual([]);
  });
});
