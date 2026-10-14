import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { randomAvatar } from "@/domain/avatar";
import { db } from "@/server/db";

const baseAdapter = PrismaAdapter(db);

/** Google accounts start without username (chosen on first access) and with a random avatar. */
export const authAdapter: Adapter = {
  ...baseAdapter,
  async createUser({ name, email, emailVerified, image }) {
    const user = await db.user.create({ data: { name, email, emailVerified, image, ...randomAvatar() } });
    return user as unknown as AdapterUser;
  },
};
