import Link from "next/link";
import { Fragment } from "react";

import { Button } from "../ui/button";

type Props = {
  variant?: "marketing" | "app";
  userName?: string;
  onSignOut?: () => Promise<void>;
};

export function StickyHeader({ variant = "marketing", userName, onSignOut }: Props) {
  const isAuthenticated = Boolean(userName);

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold text-base tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
            LL
          </div>
          <div className="leading-tight">
            <span className="block text-sm uppercase tracking-[0.2em] text-muted-foreground">LeadLah</span>
            <span className="text-lg font-semibold text-foreground">Property Agent OS</span>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          {variant === "marketing" ? (
            <Fragment>
              <Link href="/#features" className="transition hover:text-foreground">
                Why LeadLah?
              </Link>
              <Link href="/#automation" className="transition hover:text-foreground">
                Automation
              </Link>
              <Link href="/#faq" className="transition hover:text-foreground">
                FAQ
              </Link>
              <Button asChild size="sm" className="shadow-card">
                <Link href="/sign-in">Launch App</Link>
              </Button>
            </Fragment>
          ) : (
            <Fragment>
              {isAuthenticated && onSignOut ? (
                <form action={onSignOut}>
                  <Button type="submit" variant="ghost" size="sm" className="text-foreground">
                    Sign out {userName ? `(${userName.split(" ")[0]})` : ""}
                  </Button>
                </form>
              ) : (
                <Button asChild size="sm" variant="secondary" className="shadow-card">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              )}
            </Fragment>
          )}
        </nav>
      </div>
    </header>
  );
}
