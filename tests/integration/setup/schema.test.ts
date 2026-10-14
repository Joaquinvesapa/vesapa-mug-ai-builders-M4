import { describe, expect, it } from "vitest";
import { withCleanDb } from "./db";

const db = withCleanDb();

async function createStage(position = 0) {
  return db.stage.create({ data: { name: `Stage ${position}`, position } });
}

describe("database schema", () => {
  it("rejects a show whose end is not after its start", async () => {
    const stage = await createStage();
    const at = new Date("2026-11-21T21:00:00Z");

    await expect(
      db.show.create({
        data: { id: "s1", artist: "A", description: "D", festivalDay: new Date("2026-11-21"), stageId: stage.id, startsAt: at, endsAt: at },
      }),
    ).rejects.toThrow();
  });

  it("rejects a sixth stage position", async () => {
    await expect(createStage(5)).rejects.toThrow();
  });

  it("enforces case-insensitive username uniqueness through usernameKey", async () => {
    const base = { avatarShape: "circle", avatarColor: "violet" } as const;
    await db.user.create({ data: { ...base, username: "Ana", usernameKey: "ana" } });

    await expect(db.user.create({ data: { ...base, username: "aNA", usernameKey: "ana" } })).rejects.toThrow();
  });

  it("allows a person to belong to at most one group", async () => {
    const base = { avatarShape: "circle", avatarColor: "violet" } as const;
    const owner = await db.user.create({ data: { ...base, username: "owner", usernameKey: "owner" } });
    const g1 = await db.group.create({ data: { name: "G1", ownerId: owner.id } });
    const g2 = await db.group.create({ data: { name: "G2", ownerId: owner.id } });
    await db.membership.create({ data: { groupId: g1.id, userId: owner.id } });

    await expect(db.membership.create({ data: { groupId: g2.id, userId: owner.id } })).rejects.toThrow();
  });
});
