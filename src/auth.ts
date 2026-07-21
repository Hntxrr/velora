import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Auth.js (NextAuth v5) configuration.
 * - Providers: Google, Apple, Discord (credentials auto-read from AUTH_* env).
 * - PrismaAdapter persists users/accounts; JWT session strategy keeps session
 *   checks fast and edge-friendly.
 * - The user's plan (FREE | PRO) is carried on the session for gating.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Apple({ allowDangerousEmailAccountLinking: true }),
    Discord({ allowDangerousEmailAccountLinking: true }),
    // Quick email sign-in — no OAuth setup needed. Finds or creates a user by
    // email so you can start using the app immediately.
    Credentials({
      id: "quick",
      name: "Email",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!email || !email.includes("@")) return null;
        let user = await db.user.findUnique({ where: { email } });
        if (!user) {
          user = await db.user.create({
            data: { email, name: email.split("@")[0] },
          });
        }
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in the adapter user carries the DB fields, including plan.
      if (user) {
        token.id = user.id as string;
        token.plan = (user as { plan?: Plan }).plan ?? "FREE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.plan = (token.plan as Plan) ?? "FREE";
      }
      return session;
    },
  },
});
