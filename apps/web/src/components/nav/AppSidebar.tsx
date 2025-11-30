"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import { appNavLinks } from "./app-links";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  userName?: string;
  onSignOut?: () => Promise<void>;
  subscription: {
    status: string;
    nextBillingAt: string | Date;
  };
};

export function AppSidebar({ userName, onSignOut, subscription }: SidebarProps) {
  const pathname = usePathname();
  const isPastDue = subscription.status === "PAST_DUE";
  const billingDate = new Date(subscription.nextBillingAt);

  return (
    <aside className="hidden w-full max-w-xs flex-col rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_10px_50px_rgba(15,23,42,0.08)] backdrop-blur lg:flex">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-semibold text-white">
          LL
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">LeadLah</p>
          <p className="text-base font-semibold text-slate-900">Property Agent OS</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Signed in as {userName ?? "Agent"}</p>
      <Separator className="my-6" />

      <nav className="space-y-1">
        {appNavLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition hover:shadow-md",
                isActive
                  ? "border-slate-900/10 bg-slate-900 text-white hover:bg-slate-900"
                  : "border-transparent bg-slate-100 text-slate-600 hover:border-slate-200 hover:bg-white"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl text-base",
                  isActive ? "bg-white/15 text-white" : "bg-white text-slate-500"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p className={cn("font-semibold", isActive ? "text-white" : "text-slate-800")}>{link.label}</p>
                <p className={cn("text-xs", isActive ? "text-white/70" : "text-slate-500")}>{link.description}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Subscription</p>
          <Badge tone={isPastDue ? "danger" : "success"}>{isPastDue ? "Past Due" : "Active"}</Badge>
        </div>
        <p className="mt-1 text-xs text-white/70">
          Next billing {billingDate.toLocaleDateString("en-MY", { month: "short", day: "numeric" })}
        </p>
        <Button asChild size="sm" variant="secondary" className="mt-4 w-full bg-white text-slate-900 hover:bg-slate-100">
          <Link href="/billing">Manage Billing</Link>
        </Button>
      </div>

      {onSignOut && (
        <form action={onSignOut} className="mt-4">
          <Button type="submit" variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-900">
            Sign out
          </Button>
        </form>
      )}
    </aside>
  );
}

export function AppMobileNav(props: ComponentProps<"div">) {
  const pathname = usePathname();

  return (
    <div {...props}>
      <div className="flex snap-x gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {appNavLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "snap-start rounded-xl px-4 py-2 text-sm font-semibold transition",
                isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
