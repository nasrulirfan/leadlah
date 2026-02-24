import { cache } from "react";
import { userProfileSchema, type UserProfile } from "@leadlah/core";
import { isApiNotFound, requestApi } from "@/lib/api";

const fallbackProfile: UserProfile = {
  id: "unknown-user",
  name: "LeadLah User",
  email: "user@leadlah.com",
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
