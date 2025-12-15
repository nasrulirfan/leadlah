import { cache } from "react";
import { userProfileSchema, type UserProfile } from "@leadlah/core";
import { db } from "@/lib/db";

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

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  agency: string | null;
  role: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  timezone: string;
  language: string;
  whatsapp: string | null;
  notifications: {
    reminders: boolean;
    smartDigest: boolean;
    productUpdates: boolean;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const profileColumns =
  '"id", name, email, phone, agency, role, bio, "avatarUrl", "coverUrl", timezone, language, whatsapp, notifications, "createdAt", "updatedAt"';

const toProfile = (row: ProfileRow, overrides?: Partial<UserProfile>): UserProfile => {
  const base = cloneProfile(fallbackProfile);
  const notifications = {
    ...base.notifications,
    ...(row.notifications ?? {}),
    ...(overrides?.notifications ?? {})
  };

  return userProfileSchema.parse({
    ...base,
    ...overrides,
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    agency: row.agency ?? undefined,
    role: row.role ?? undefined,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    coverUrl: row.coverUrl ?? undefined,
    timezone: row.timezone,
    language: row.language,
    whatsapp: row.whatsapp ?? undefined,
    notifications
  });
};

const buildProfileFromOverrides = (userId: string, overrides?: Partial<UserProfile>): UserProfile => {
  const base = cloneProfile(fallbackProfile);
  const notifications = {
    ...base.notifications,
    ...(overrides?.notifications ?? {})
  };

  return userProfileSchema.parse({
    ...base,
    ...overrides,
    id: userId,
    notifications
  });
};

export const fetchProfile = cache(async (userId: string, overrides?: Partial<UserProfile>): Promise<UserProfile> => {
  const result = await db.query<ProfileRow>(
    `SELECT ${profileColumns} FROM "profiles" WHERE id = $1 LIMIT 1`,
    [userId]
  );
  const row = result.rows[0];
  if (!row) {
    return buildProfileFromOverrides(userId, overrides);
  }
  return toProfile(row, overrides);
});

export async function persistProfile(profile: UserProfile): Promise<UserProfile> {
  const parsed = userProfileSchema.parse(profile);

  const result = await db.query<ProfileRow>(
    `
      INSERT INTO "profiles"
        (id, name, email, phone, agency, role, bio, "avatarUrl", "coverUrl", timezone, language, whatsapp, notifications)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        agency = EXCLUDED.agency,
        role = EXCLUDED.role,
        bio = EXCLUDED.bio,
        "avatarUrl" = EXCLUDED."avatarUrl",
        "coverUrl" = EXCLUDED."coverUrl",
        timezone = EXCLUDED.timezone,
        language = EXCLUDED.language,
        whatsapp = EXCLUDED.whatsapp,
        notifications = EXCLUDED.notifications,
        "updatedAt" = NOW()
      RETURNING ${profileColumns}
    `,
    [
      parsed.id,
      parsed.name,
      parsed.email,
      parsed.phone ?? null,
      parsed.agency ?? null,
      parsed.role ?? null,
      parsed.bio ?? null,
      parsed.avatarUrl ?? null,
      parsed.coverUrl ?? null,
      parsed.timezone,
      parsed.language,
      parsed.whatsapp ?? null,
      parsed.notifications
    ]
  );

  return toProfile(result.rows[0]);
}
