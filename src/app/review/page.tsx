import { AppShell } from "@/components/shell/AppShell";
import { ReviewQueue } from "@/components/review/ReviewQueue";
import { listDrafts } from "@/lib/review";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const drafts = await listDrafts();
  return (
    <AppShell title="Review Queue" reviewCount={drafts.length}>
      <ReviewQueue drafts={drafts} />
    </AppShell>
  );
}
