import { db } from "@/lib/db";
import { syncConnection } from "@/lib/email/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Background sync endpoint. A scheduler (Vercel Cron) or the always-on worker
 * hits this to keep email detection running server-side, independent of any
 * client being open. Protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const connections = await db.emailConnection.findMany({
    where: { status: { not: "DISCONNECTED" } },
    select: { id: true },
  });

  const results = [];
  for (const c of connections) {
    results.push(await syncConnection(c.id));
  }

  const totalNew = results.reduce((a, r) => a + r.newDrafts, 0);
  return Response.json({ ok: true, connections: connections.length, newDrafts: totalNew });
}
