"use client";
import { useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PageHeaderContext } from "@/components/app/app-page-header";
import { AppMobileFooter } from "@/components/app/app-mobile-footer";
import { AppMobileHeader } from "@/components/app/app-mobile-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function CrmShell({ children, name }: { children: React.ReactNode; name: string }) {
  const pathname = usePathname();
  const isInbox = pathname === "/inbox";
  const [header, setHeader] = useState<HTMLElement | null>(null);
  return (
    <SidebarProvider
      className="h-dvh min-h-0 overflow-hidden"
      style={{ "--sidebar-width": "17rem" } as CSSProperties}
    >
      <AppMobileHeader name={name} />
      <AppSidebar name={name} />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden max-md:pt-14 max-md:pb-20 md:rounded-2xl md:border md:shadow-none">
        <header
          key={pathname}
          ref={setHeader}
          data-slot="page-navbar"
          className={cn(
            "z-10 shrink-0 border-b bg-background px-5 py-3.5 transition-colors empty:hidden data-[scrolled=true]:border-border md:px-8",
            isInbox ? "border-border" : "border-transparent",
          )}
        />
        <PageHeaderContext value={header}>
          <div
            key={pathname}
            data-slot="page-content"
            className={cn(
              "min-h-0 flex-1 overscroll-contain",
              isInbox ? "flex flex-col overflow-hidden" : "overflow-y-auto",
            )}
            onScroll={(event) => {
              if (header) header.dataset.scrolled = String(event.currentTarget.scrollTop > 0);
            }}
          >
            <div
              className={cn(
                "flex flex-col",
                isInbox ? "min-h-0 flex-1" : "mt-4 gap-6 px-5 pb-5 md:mt-6 md:px-8 md:pb-8",
              )}
            >
              {children}
            </div>
          </div>
        </PageHeaderContext>
      </SidebarInset>
      <AppMobileFooter />
    </SidebarProvider>
  );
}
