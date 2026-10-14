import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { authAdapter } from "@/server/auth/adapter";
import { SESSION_MAX_AGE_MS } from "@/server/session";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: authAdapter,
  providers: [Google],
  session: {
    strategy: "database",
    maxAge: SESSION_MAX_AGE_MS / 1000,
    updateAge: 24 * 60 * 60,
  },
  pages: { signIn: "/login", error: "/login" },
});
