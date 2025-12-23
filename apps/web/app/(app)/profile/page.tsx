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

  return (
    <ProfileClient profile={profile} />
  );
}
