import { AppShell } from "@/components/shell/AppShell";
import { DeliveryCalendar } from "@/components/calendar/DeliveryCalendar";
import { getDeliveryEvents } from "@/lib/tracking";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  const now = new Date();
  let year = now.getFullYear();
  let mon = now.getMonth();
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    year = y;
    mon = m - 1;
  }

  const start = new Date(year, mon, 1);
  const end = new Date(year, mon + 1, 1);
  const monthISO = `${year}-${String(mon + 1).padStart(2, "0")}-01`;

  const events = await getDeliveryEvents(start, end);

  return (
    <AppShell title="Calendar">
      <DeliveryCalendar monthISO={monthISO} events={events} />
    </AppShell>
  );
}
