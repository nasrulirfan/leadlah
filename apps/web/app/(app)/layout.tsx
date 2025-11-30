import Link from "next/link";
import { ReactNode } from "react";
import { headers } from "next/headers";
import { StickyHeader } from "@/components/nav/StickyHeader";
import { Badge } from "@/components/ui/badge";
import { subscriptionState } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { auth, ensureAuthReady } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureAuthReady();
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <StickyHeader variant="app" userName={session?.user.name} onSignOut={session ? signOut : undefined} />
      {subscriptionState.status === "PAST_DUE" && (
        <div className="bg-red-50 text-red-800 border-b border-red-100">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-sm">
            <span className="font-semibold">
              Your subscription payment failed. Please update your payment method to avoid account suspension.
            </span>
            <div className="flex items-center gap-3">
              <Badge tone="danger">Past Due</Badge>
              <Button asChild size="sm" variant="secondary" className="border-red-200 text-red-700">
                <Link href="/billing">Update Card</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <nav className="flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
          <Link href="/dashboard" className="hover:text-brand-700">
            Dashboard
          </Link>
          <Link href="/listings" className="hover:text-brand-700">
            Listings
          </Link>
          <Link href="/calculators" className="hover:text-brand-700">
            Calculators
          </Link>
          <Link href="/billing" className="hover:text-brand-700">
            Billing
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
