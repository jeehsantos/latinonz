import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { MobileBottomNav } from "./MobileBottomNav";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <SiteHeader />
      <main className="flex-1 pb-[72px] md:pb-0">{children}</main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  );
}
