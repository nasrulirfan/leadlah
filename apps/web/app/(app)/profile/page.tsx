import { CalendarDays, Link as LinkIcon, ShieldCheck, Sparkles, User } from "lucide-react";
import type { UserProfile } from "@leadlah/core";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { reminders } from "@/lib/mock-data";
import { requireSession } from "@/lib/session";
import { fetchProfile } from "@/data/profile";

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = await fetchProfile(session.user.id, {
    name: session.user.name ?? undefined,
    email: session.user.email ?? undefined
  });

  const stats = [
    { label: "Avg response time", value: "12 mins", caption: "Last 30 days" },
    { label: "Owner satisfaction", value: "4.9 / 5", caption: "20 latest surveys" },
    { label: "Listings synced", value: "18", caption: "Across Mudah & PropertyGuru" }
  ];

  const upcomingReminders = reminders.slice(0, 2);

  return (
    <div className="space-y-6">
      <ProfileHero profile={profile} stats={stats} />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <ProfileForm profile={profile} />
        <div className="space-y-6">
          <RemindersCard reminders={upcomingReminders} />
          <SecurityCard />
        </div>
      </div>
    </div>
  );
}

function ProfileHero({ profile, stats }: { profile: UserProfile; stats: { label: string; value: string; caption: string }[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="relative h-40 w-full overflow-hidden rounded-[26px] bg-gradient-to-r from-brand-600 via-indigo-600 to-primary" aria-hidden>
        {profile.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.coverUrl}
            alt="Profile cover"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/30 to-slate-900/60" />
      </div>
      <div className="-mt-12 flex flex-wrap items-center gap-5 px-6 pb-6">
        <div className="relative h-24 w-24 overflow-hidden rounded-3xl border-4 border-card bg-background shadow-2xl">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted text-3xl font-semibold text-muted-foreground">
              {profile.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((chunk) => chunk.charAt(0).toUpperCase())
                .join("") || "LL"}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-[240px] space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge tone="primary">{profile.role ?? "Real Estate Negotiator"}</Badge>
            <span className="text-xs text-muted-foreground">{profile.agency ?? "Independent"}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{profile.name}</h1>
          <p className="text-sm text-muted-foreground">{profile.bio ?? "Set your bio to let leads know what you specialise in."}</p>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {profile.email}
            </div>
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {profile.timezone}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" size="sm" className="rounded-full">
            <Sparkles className="mr-2 h-4 w-4" /> Share profile link
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <LinkIcon className="mr-2 h-4 w-4" /> Preview owner report
          </Button>
        </div>
      </div>
      <div className="border-t border-border/60">
        <dl className="grid gap-4 px-6 py-5 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</dt>
              <dd className="text-lg font-semibold text-foreground">{stat.value}</dd>
              <p className="text-xs text-muted-foreground">{stat.caption}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function RemindersCard({
  reminders: entries
}: {
  reminders: { id: string; message: string; type: string; dueAt: Date }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Upcoming reminders
        </CardTitle>
        <CardDescription>We surface the next critical nudges so you can act before owners chase.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((reminder) => (
          <div key={reminder.id} className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>{reminder.message}</span>
              <Badge tone="warning" className="text-[10px] capitalize">
                {reminder.type.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Due {reminder.dueAt.toLocaleDateString()}</p>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">You are fully clear for the next week. 🎉</p>}
      </CardContent>
    </Card>
  );
}

function SecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          Account safety
        </CardTitle>
        <CardDescription>Manage authentication, session health, and connected channels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Last changed 42 days ago</p>
            </div>
            <Button variant="ghost" size="sm">
              Update
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">WhatsApp Broadcast</p>
              <p className="text-xs text-muted-foreground">Connected via +60 ending 4455</p>
            </div>
            <Badge tone="success">Active</Badge>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Calendar availability</p>
              <p className="text-xs text-muted-foreground">Synced with Google Calendar</p>
            </div>
            <Badge tone="info">Syncing</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
