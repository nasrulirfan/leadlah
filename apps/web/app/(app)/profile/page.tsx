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

  return (
    <div className="space-y-6">
      <ProfileHero profile={profile} stats={stats} />
      <ProfileForm profile={profile} />
    </div>
  );
}

function ProfileHero({ profile, stats }: { profile: UserProfile; stats: { label: string; value: string; caption: string }[] }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center gap-5 px-6 py-6">
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
        <div className="flex flex-col gap-2" />
      </div>
    </section>
  );
}

function SecurityCard() {
  return (
    null
  );
}
