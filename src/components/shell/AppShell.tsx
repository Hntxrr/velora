import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";

export function AppShell({
  title,
  reviewCount,
  children,
}: {
  title: string;
  reviewCount?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-10 flex min-h-dvh">
      <Sidebar reviewCount={reviewCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <main className="flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-8">
          <div className="mx-auto w-full max-w-[1400px] animate-fade-up">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
