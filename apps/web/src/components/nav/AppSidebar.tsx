"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
import type { SubscriptionState } from "@leadlah/core";
import { SubscriptionStatus } from "@leadlah/core";
import { appNavLinks } from "./app-links";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  userName?: string;
  onSignOut?: () => Promise<void>;
  subscription?: Pick<SubscriptionState, "status" | "nextBillingAt"> | null;
};

export function AppSidebar({ userName, onSignOut, subscription }: SidebarProps) {
  const pathname = usePathname();
  const isPastDue = subscription?.status === SubscriptionStatus.PAST_DUE;
  const billingDate = subscription?.nextBillingAt ? new Date(subscription.nextBillingAt) : null;

  return (
    <aside className="hidden w-full max-w-xs flex-col rounded-3xl border border-border/70 bg-card/90 p-6 text-foreground shadow-[0_10px_50px_rgba(15,23,42,0.08)] backdrop-blur lg:flex dark:border-slate-800/80 dark:bg-slate-900/40">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-lg font-semibold text-primary-foreground">
          LL
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">LeadLah</p>
          <p className="text-base font-semibold text-foreground">Property Agent OS</p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Signed in as {userName ?? "Agent"}</p>
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
                  ? "border-primary/30 bg-primary text-primary-foreground"
                  : "border-transparent bg-muted/70 text-muted-foreground hover:border-border hover:bg-card"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl text-base",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-background text-muted-foreground shadow-sm dark:bg-slate-800/60"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="text-left">
                <p
                  className={cn(
                    "font-semibold",
                    isActive ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {link.label}
                </p>
                <p className={cn("text-xs", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {link.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-lg dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Subscription</p>
          <Badge tone={isPastDue ? "danger" : subscription ? "success" : "neutral"}>
            {subscription ? subscription.status : "Untracked"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-white/70">
          {billingDate ? `Next billing ${billingDate.toLocaleDateString("en-MY", { month: "short", day: "numeric" })}` : "No billing schedule"}
        </p>
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="mt-4 w-full bg-white text-slate-900 hover:bg-slate-100 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        >
          <Link href="/billing">Manage Billing</Link>
        </Button>
      </div>

      {onSignOut && (
        <form action={onSignOut} className="mt-4">
          <Button type="submit" variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
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
      <div className="flex snap-x gap-2 overflow-x-auto rounded-2xl border border-border bg-card/90 p-2 shadow-sm dark:bg-slate-900/40">
        {appNavLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "snap-start rounded-xl px-4 py-2 text-sm font-semibold transition",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
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
