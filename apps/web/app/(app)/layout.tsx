import Link from "next/link";
import { ReactNode } from "react";
import { headers } from "next/headers";
import { StickyHeader } from "@/components/nav/StickyHeader";
import { Badge } from "@/components/ui/badge";
import { subscriptionState } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { auth, ensureAuthReady } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { AppMobileNav, AppSidebar } from "@/components/nav/AppSidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureAuthReady();
  const session = await auth.api.getSession({
    headers: await headers()
  });

  const isPastDue = subscriptionState.status === "PAST_DUE";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="app" userName={session?.user.name} onSignOut={session ? signOut : undefined} />
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-6 transition-colors lg:flex-row lg:px-6 lg:py-10 2xl:max-w-[1440px]">
        <AppSidebar userName={session?.user.name} onSignOut={session ? signOut : undefined} subscription={subscriptionState} />
        <main className="flex-1 space-y-6">
          <AppMobileNav className="lg:hidden" />
          {isPastDue && (
            <div className="rounded-2xl border border-red-100 bg-red-50/80 px-5 py-4 text-red-900 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Your subscription payment failed. Please update your payment method to avoid account suspension.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="danger">Past Due</Badge>
                  <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    className="border-red-200 text-red-700 dark:border-red-500/40 dark:bg-transparent dark:text-red-100"
                  >
                    <Link href="/billing">Update Card</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
