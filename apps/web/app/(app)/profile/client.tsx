"use client";

import { motion } from "framer-motion";
import { CalendarDays, Mail, ShieldCheck, Sparkles, User } from "lucide-react";
import type { UserProfile } from "@leadlah/core";

import { PageHero } from "@/components/app/PageHero";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ProfileClientProps = {
  profile: UserProfile;
  stats: { label: string; value: string; caption: string }[];
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] }
  }
};

export function ProfileClient({ profile, stats }: ProfileClientProps) {
  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk.charAt(0).toUpperCase())
      .join("") || "LL";

  return (
    <div className="space-y-6">
      <PageHero
        title="Profile"
        description="Keep your agent details consistent across reminders, branded receipts, and owner reporting."
        icon={<User />}
        badges={
          <>
            <Badge tone="primary" className="border-white/10 bg-white/10 text-white">
              {profile.role ?? "Real Estate Negotiator"}
            </Badge>
            <Badge tone="neutral" className="border-white/10 bg-white/10 text-white">
              {profile.agency ?? "Independent"}
            </Badge>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Live sync
            </div>
          </>
        }
      />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={cardVariants} className="lg:col-span-2">
          <Card className="border-border/70 bg-card/90 shadow-sm dark:bg-slate-900/40">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-3xl border border-border bg-background shadow-inner">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-foreground">{profile.name}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {profile.email}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {profile.timezone}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Profile changes update receipts and reminders instantly.
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="border-border/70 bg-card/90 shadow-sm dark:bg-slate-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highlights</p>
            <div className="mt-4 space-y-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-start justify-between gap-3 rounded-2xl bg-muted/30 p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.caption}</p>
                  </div>
                  <p className={cn("text-sm font-semibold text-foreground")}>{stat.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
        <ProfileForm profile={profile} />
      </motion.div>
    </div>
  );
}
