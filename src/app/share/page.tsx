import { AppShell } from "@/components/shell/AppShell";
import { ShareStudio } from "@/components/share/ShareStudio";
import { getShareData } from "@/lib/share";

export const dynamic = "force-dynamic";

export default async function SharePage() {
  const data = await getShareData();
  return (
    <AppShell title="Share Studio">
      <p className="mb-5 text-[13.5px] text-fg-muted">
        Turn your numbers into a shareable card — animated count-up, exported as a GIF or image.
      </p>
      <ShareStudio data={data} />
    </AppShell>
  );
}
