import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint. Reports which env vars are present (booleans only — no
 * secret values) and whether the database is reachable with its tables created.
 * Visit /api/health to debug a deployment.
 */
export async function GET() {
  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: !!process.env.AUTH_TRUST_HOST,
    CREDENTIAL_ENCRYPTION_KEY: !!process.env.CREDENTIAL_ENCRYPTION_KEY,
    CRON_SECRET: !!process.env.CRON_SECRET,
  };

  let database: { ok: boolean; users?: number; error?: string };
  try {
    const users = await db.user.count();
    database = { ok: true, users };
  } catch (e) {
    database = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return Response.json(
    { ok: env.DATABASE_URL && env.AUTH_SECRET && database.ok, env, database },
    { status: 200 }
  );
}
