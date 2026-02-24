import { cache } from "react";
import { userProfileSchema, type UserProfile } from "@leadlah/core";
import { isApiNotFound, requestApi } from "@/lib/api";

const fallbackProfile: UserProfile = {
  id: "demo-user",
  name: "Alicia Rahman",
  email: "alicia@leadlah.com",
  phone: "+60 12-555 4455",
  whatsapp: "+60 12-555 4455",
  agency: "Nova Realty Group",
  renNumber: "REN 12345",
  agencyLogoUrl:
    "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=200&q=80",
  role: "Senior Real Estate Negotiator",
  bio: "I close lifestyle properties across KLCC, Mont Kiara, and Damansara with a concierge-style service mindset.",
  avatarUrl:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
  coverUrl:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  timezone: "Asia/Kuala_Lumpur",
  language: "English (Malaysia)",
  notifications: {
    reminders: true,
    smartDigest: true,
    productUpdates: false,
  },
};

function cloneProfile(profile: UserProfile): UserProfile {
  return {
    ...profile,
    notifications: { ...profile.notifications },
  };
}

export function getFallbackProfile(): UserProfile {
  return cloneProfile(fallbackProfile);
}

const toProfile = (
  profile: UserProfile,
  overrides?: Partial<UserProfile>,
): UserProfile => {
  const base = cloneProfile(fallbackProfile);
  const notifications = {
    ...base.notifications,
    ...(profile.notifications ?? {}),
    ...(overrides?.notifications ?? {}),
  };

  return userProfileSchema.parse({
    ...base,
    ...profile,
    ...overrides,
    notifications,
  });
};

const buildProfileFromOverrides = (
  userId: string,
  overrides?: Partial<UserProfile>,
): UserProfile => {
  const base = cloneProfile(fallbackProfile);
  const notifications = {
    ...base.notifications,
    ...(overrides?.notifications ?? {}),
  };

  return userProfileSchema.parse({
    ...base,
    ...overrides,
    id: userId,
    notifications,
  });
};

export const fetchProfile = cache(
  async (
    userId: string,
    overrides?: Partial<UserProfile>,
  ): Promise<UserProfile> => {
    try {
      const profile = await requestApi<UserProfile>(`/profiles/${userId}`);
      return toProfile(profile, overrides);
    } catch (error) {
      if (isApiNotFound(error)) {
        return buildProfileFromOverrides(userId, overrides);
      }
      throw error;
    }
  },
);

export async function persistProfile(
  profile: UserProfile,
): Promise<UserProfile> {
  const parsed = userProfileSchema.parse(profile);
  const { id, ...payload } = parsed;
  const saved = await requestApi<UserProfile>(`/profiles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return toProfile(saved);
}
