import { cache } from "react";
import { userProfileSchema, type UserProfile } from "@leadlah/core";

const fallbackProfile: UserProfile = {
  id: "demo-user",
  name: "Alicia Rahman",
  email: "alicia@leadlah.com",
  phone: "+60 12-555 4455",
  whatsapp: "+60 12-555 4455",
  agency: "Nova Realty Group",
  role: "Senior Real Estate Negotiator",
  bio: "I close lifestyle properties across KLCC, Mont Kiara, and Damansara with a concierge-style service mindset.",
  avatarUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
  coverUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  timezone: "Asia/Kuala_Lumpur",
  language: "English (Malaysia)",
  notifications: {
    reminders: true,
    smartDigest: true,
    productUpdates: false
  }
};

function cloneProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    notifications: { ...profile.notifications }
  };
}

export function getFallbackProfile(): UserProfile {
  return cloneProfile(fallbackProfile);
}

export const fetchProfile = cache(async (userId: string, overrides?: Partial<UserProfile>): Promise<UserProfile> => {
  const base = cloneProfile(fallbackProfile);
  const profile: UserProfile = {
    ...base,
    ...overrides,
    id: userId,
    notifications: {
      ...base.notifications,
      ...(overrides?.notifications ?? {})
    }
  };

  return userProfileSchema.parse(profile);
});

export async function persistProfile(profile: UserProfile): Promise<UserProfile> {
  const parsed = userProfileSchema.parse(profile);
  return cloneProfile(parsed);
}
