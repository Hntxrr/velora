import { auth } from "@/auth";

/** Get the current session in a server component / server action. */
export async function getSession() {
  return auth();
}

/** True when the signed-in user is on the Pro plan (gates paid features). */
export async function isPro() {
  const session = await auth();
  return session?.user?.plan === "PRO";
}
