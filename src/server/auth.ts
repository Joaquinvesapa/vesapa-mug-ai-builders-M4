import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import { randomAvatar } from "@/domain/avatar";
import { db } from "@/server/db";
import { SESSION_MAX_AGE_MS } from "@/server/session";

const baseAdapter = PrismaAdapter(db);

/** Google accounts start without username (chosen on first access) and with a random avatar. */
const adapter: Adapter = {
  ...baseAdapter,
  async createUser({ name, email, emailVerified, image }) {
    const user = await db.user.create({ data: { name, email, emailVerified, image, ...randomAvatar() } });
    return user as unknown as AdapterUser;
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  providers: [Google],
  session: {
    strategy: "database",
    maxAge: SESSION_MAX_AGE_MS / 1000,
    updateAge: 24 * 60 * 60,
  },
  pages: { signIn: "/login", error: "/login" },
});
