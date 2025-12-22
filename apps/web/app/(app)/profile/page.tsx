import type { UserProfile } from "@leadlah/core";

import { requireSession } from "@/lib/session";
import { fetchProfile } from "@/data/profile";
import { ProfileClient } from "./client";

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
    <ProfileClient profile={profile} stats={stats} />
  );
}
