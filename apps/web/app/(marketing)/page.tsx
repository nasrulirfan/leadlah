import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";

import { StickyHeader } from "@/components/nav/StickyHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const heroMetrics = [
  { label: "REN seats activated", value: "320+" },
  { label: "Owner links shared", value: "940", suffix: "/mo" },
  { label: "Hours saved weekly", value: "9h" }
];

const renFeatures = [
  {
    title: "Fishbone Tracker",
    description: "Visual workflow from appointment to handover with accountability on every stage.",
    icon: ClipboardList
  },
  {
    title: "Listing Intelligence",
    description: "Portal health, ad expiry, and owner reminders appear in a single stream.",
    icon: BarChart3
  },
  {
    title: "Owner Transparency",
    description: "Secure share links with live progress, media status, and cost receipts.",
    icon: ShieldCheck
  }
];

const ownerFeatures = [
  {
    title: "Smart Reminders",
    description: "Expiry, tenancy, and exclusive contract alerts sent automatically to REN & owners.",
    icon: CalendarClock
  },
  {
    title: "One-tap Updates",
    description: "Broadcast progress to multiple owners with templates and CTA tracking.",
    icon: Sparkles
  },
  {
    title: "Branded PDFs",
    description: "Generate receipt-quality PDFs for DSR, legal fees, ROI, tenancy and land feasibility.",
    icon: CheckCircle2
  }
];

const calculatorFeatures = [
  {
    title: "Reverse DSR",
    description: "Bank-lender style breakdowns with max loan amount, price bands, and shareable receipts.",
    icon: Zap
  },
  {
    title: "Legal & Stamp Duty",
    description: "SPA/MOT, loan agreement, tenancy stamp and land feasibility calculators tuned for Malaysia.",
    icon: ShieldCheck
  },
  {
    title: "ROI & Sellability",
    description: "Pro worksheet to defend pricing, forecast rent, and present market positioning.",
    icon: BarChart3
  }
];

const automations = [
  {
    title: "Portal Expiry Guard",
    badge: "Reminders",
    description: "Auto-create reminders whenever you log iProperty, PropertyGuru, EdgeProp, or FB Boost expiry."
  },
  {
    title: "Owner Follow Ups",
    badge: "Messaging",
    description: "Send templated WhatsApp/email summaries with CTA tracking to prove weekly momentum."
  },
  {
    title: "Paperwork Vault",
    badge: "Docs",
    description: "Drop SPA, tenancy, receipts into one listing vault. Owners see the same clean record."
  }
];

const faqs = [
  {
    question: "Is this really shadcn UI?",
    answer:
      "Yes. Every button, card, tab and accordion is composed from the shadcn/ui primitives with Radix under the hood, themed for the LeadLah brand."
  },
  {
    question: "Do I need to code to edit sections?",
    answer:
      "No. Marketing blocks live inside the Next.js layout. Update the copy inside `apps/web/app/(marketing)/page.tsx` and the shadcn components do the rest."
  },
  {
    question: "Can owners access without logging in?",
    answer:
      "Owner links are generated with secure tokens from `@leadlah/core`. They only expose the fishbone timeline and calculators you enable."
  }
];

const logos = ["IQI", "ERA", "Reapfield", "Hartamas", "Tech Realtors", "Allied Group"];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/80 to-white dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-950">
      <StickyHeader variant="marketing" />
      <main className="container space-y-16 py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <Badge variant="secondary" className="w-fit">
              Next.js + shadcn/ui
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground md:text-5xl">
                The professional Operating System for Malaysian property agents.
              </h1>
              <p className="text-lg text-muted-foreground">
                Stop running your agency on WhatsApp folders. LeadLah unifies listings, reminders, calculators,
                and billing with an opinionated shadcn design system.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/sign-in">Launch App</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">
                  Try for free
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <Card key={metric.label} padded className="bg-card/80 backdrop-blur dark:bg-slate-900/60">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {metric.value}
                    {metric.suffix && <span className="text-sm font-medium text-muted-foreground"> {metric.suffix}</span>}
                  </p>
                </Card>
              ))}
            </div>
          </div>
          <Card className="relative overflow-hidden border-none bg-gradient-to-br from-white via-brand-50 to-white shadow-card dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(29,103,255,0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(80,130,255,0.18),transparent_45%)]" />
            <div className="relative space-y-5 p-6">
              <Image
                src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80"
                alt="LeadLah dashboard preview"
                width={1200}
                height={800}
                className="h-72 w-full rounded-2xl object-cover"
                priority
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Card padded className="bg-background/90 dark:bg-slate-900/70">
                  <CardHeader className="space-y-1 p-0">
                    <CardTitle className="text-base">Live Listing Health</CardTitle>
                    <CardDescription>Know which portal or owner requires action in seconds.</CardDescription>
                  </CardHeader>
                </Card>
                <Card padded className="bg-background/90 dark:bg-slate-900/70">
                  <CardHeader className="space-y-1 p-0">
                    <CardTitle className="text-base">Branded PDF Receipts</CardTitle>
                    <CardDescription>Share calculators on mobile, signed with your agency brand.</CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </Card>
        </section>

        <section className="rounded-3xl border bg-card/80 p-8 shadow-card" id="features">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <Badge variant="secondary">Feature stack</Badge>
              <h2 className="text-3xl font-semibold text-foreground">One shadcn design system across landing + app.</h2>
              <p className="text-sm text-muted-foreground">
                Swap hero copy, add calculator cards, and the Tailwind tokens keep everything consistent.
              </p>
            </div>
            <Button variant="ghost" asChild className="text-sm">
              <Link href="/owner/demo" className="gap-2">
                View owner portal mock
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Tabs defaultValue="agents" className="mt-8">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="agents">REN Teams</TabsTrigger>
              <TabsTrigger value="owners">Owners</TabsTrigger>
              <TabsTrigger value="calculators">Calculators</TabsTrigger>
            </TabsList>
            <TabsContent value="agents" className="grid gap-4 md:grid-cols-3">
              {renFeatures.map((feature) => (
                <Card key={feature.title} padded>
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="owners" className="grid gap-4 md:grid-cols-3">
              {ownerFeatures.map((feature) => (
                <Card key={feature.title} padded>
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="calculators" className="grid gap-4 md:grid-cols-3">
              {calculatorFeatures.map((feature) => (
                <Card key={feature.title} padded>
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </section>

        <section
          id="automation"
          className="grid gap-8 rounded-3xl border border-slate-900 bg-slate-950 px-10 py-12 text-white shadow-card dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-white/70">Automation</p>
              <h2 className="mt-2 text-3xl font-semibold">Designed for Malaysian REN cadences.</h2>
              <p className="text-sm text-white/80">Reminders and owner comms trigger automatically off the fishbone tracker.</p>
            </div>
            <Button variant="secondary" asChild>
              <Link href="/listings">View Listings OS</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {automations.map((automation) => (
              <Card key={automation.title} padded className="bg-white/5 text-white dark:bg-white/10">
                <Badge variant="outline" className="border-white/30 text-white/80">
                  {automation.badge}
                </Badge>
                <h3 className="mt-3 text-xl font-semibold">{automation.title}</h3>
                <p className="text-sm text-white/80">{automation.description}</p>
              </Card>
            ))}
          </div>
          <Separator className="border-white/10 bg-white/10 dark:border-white/20 dark:bg-white/20" />
          <div className="flex flex-wrap gap-3">
            {logos.map((logo) => (
              <span
                key={logo}
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold tracking-wide text-white/80 dark:border-white/30"
              >
                {logo}
              </span>
            ))}
          </div>
        </section>

        <section id="faq" className="grid gap-8 rounded-3xl border bg-card/70 p-8 shadow-card lg:grid-cols-[0.6fr_0.4fr]">
          <div>
            <Badge variant="secondary">FAQ</Badge>
            <h2 className="mt-3 text-3xl font-semibold">All powered by shadcn/ui.</h2>
            <p className="text-sm text-muted-foreground">
              This repo keeps marketing + app surfaces consistent. Update copy, not CSS.
            </p>
            <Accordion type="single" collapsible className="mt-6">
              {faqs.map((faq) => (
                <AccordionItem value={faq.question} key={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <Card padded className="bg-muted/40">
            <p className="text-sm font-medium text-muted-foreground">Beta tester note</p>
            <p className="mt-3 text-lg font-semibold text-foreground">
              “LeadLah's shadcn components made our marketing site feel as polished as the dashboard—no extra CSS work.”
            </p>
            <p className="mt-4 text-sm text-muted-foreground">— Afiq, Team Lead @ IQI</p>
          </Card>
        </section>

        <footer className="border-t border-border pt-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex gap-4">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="mailto:support@leadlah.com">Support</Link>
            </div>
            <span>© {new Date().getFullYear()} LeadLah. Crafted with Next.js + shadcn/ui.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
