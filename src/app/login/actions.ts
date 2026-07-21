"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type AuthState = { error?: string };

/** Handles both sign-in and account creation based on the `mode` field. */
export async function authenticate(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const mode = String(formData.get("mode") ?? "signin");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  if (mode === "signup") {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: "An account with that email already exists. Try signing in." };
    const passwordHash = await hashPassword(password);
    await db.user.create({
      data: { email, name: name || email.split("@")[0], passwordHash },
    });
  }

  try {
    await signIn("password", { email, password, redirectTo: "/dashboard" });
    return {};
  } catch (e) {
    // signIn throws a redirect on success — rethrow it; only swallow auth errors.
    if (e instanceof AuthError) {
      return { error: mode === "signup" ? "Account created — please sign in." : "Invalid email or password." };
    }
    throw e;
  }
}
