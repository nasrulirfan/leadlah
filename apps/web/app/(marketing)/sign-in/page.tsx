import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { StickyHeader } from "@/components/nav/StickyHeader";
import { AuthForm } from "@/components/auth/AuthForm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth, ensureAuthReady } from "@/lib/auth";

const highlights = [
  {
    icon: ShieldCheck,
    title: "Better-auth sessions",
    description: "Role-aware cookies with secure Postgres storage. Rotate secrets without downtime."
  },
  {
    icon: Sparkles,
    title: "Owner-friendly links",
    description: "Agents sign in; owners keep token links. No leaked dashboards."
  },
  {
    icon: Zap,
    title: "Shadcn-grade UX",
    description: "Clean forms, keyboard friendly, zero jank when you deploy."
  }
];

export default async function SignInPage() {
  await ensureAuthReady();
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StickyHeader variant="marketing" />
      <main className="container grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <Badge tone="info">Authentication powered by Better-auth</Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-foreground md:text-5xl">Sign in to LeadLah</h1>
            <p className="text-lg text-muted-foreground">
              Secure sessions for agents and owners. Email + password today, social logins and 2FA ready when you are.
            </p>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {highlights.map((item) => (
              <Card key={item.title} padded className="flex items-start gap-4 bg-card/90 dark:bg-slate-900/60">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card padded className="bg-card shadow-card dark:bg-slate-900">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-primary">Welcome back</p>
              <p className="text-xl font-semibold text-foreground">Access your dashboard, listings, and calculators.</p>
              <p className="text-sm text-muted-foreground">Sessions persist for 30 days, revocable anytime.</p>
            </div>
            <AuthForm />
          </div>
        </Card>
      </main>
    </div>
  );
}
