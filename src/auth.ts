import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";

/** Which OAuth providers have credentials configured (server-side check). */
export const enabledOAuth = {
  google: !!process.env.AUTH_GOOGLE_ID,
  apple: !!process.env.AUTH_APPLE_ID,
  discord: !!process.env.AUTH_DISCORD_ID,
};

// Build the providers list. Quick email sign-in is always available; OAuth
// providers are only added when their keys exist so an unconfigured provider
// can't break the whole auth config.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "password",
    name: "Email & password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(creds) {
      const email = String(creds?.email ?? "").trim().toLowerCase();
      const password = String(creds?.password ?? "");
      if (!email || !password) return null;
      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash) return null;
      const { verifyPassword } = await import("@/lib/password");
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) return null;
      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
];
if (enabledOAuth.google) providers.push(Google({ allowDangerousEmailAccountLinking: true }));
if (enabledOAuth.apple) providers.push(Apple({ allowDangerousEmailAccountLinking: true }));
if (enabledOAuth.discord) providers.push(Discord({ allowDangerousEmailAccountLinking: true }));

/**
 * Auth.js (NextAuth v5) configuration.
 * - Quick email sign-in always on; Google/Apple/Discord load only when set.
 * - PrismaAdapter persists users/accounts; JWT session strategy.
 * - The user's plan (FREE | PRO) is carried on the session for gating.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers,
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
