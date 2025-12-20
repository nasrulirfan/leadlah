"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { userProfileUpdateSchema, type UserProfile } from "@leadlah/core";

import { fetchProfile, persistProfile } from "@/data/profile";
import { requireSession } from "@/lib/session";
import { auth } from "@/lib/auth";

const profileMutationSchema = userProfileUpdateSchema;

const asOptionalString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const asString = (value: FormDataEntryValue | null) => (typeof value === "string" ? value.trim() : "");

const mutationSchema = z.object({
  userId: z.string().min(1)
});

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[]>;
  data?: UserProfile;
};

export async function updateProfile(prevState: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const session = await requireSession();
  const userId = session.user?.id ?? asString(formData.get("userId"));

  const parsedUserId = mutationSchema.safeParse({ userId });
  if (!parsedUserId.success) {
    return {
      status: "error",
      message: "Your session expired. Please refresh and try again.",
      errors: parsedUserId.error.flatten().fieldErrors
    };
  }

  const currentProfile = await fetchProfile(parsedUserId.data.userId);

  const payloadResult = profileMutationSchema.safeParse({
    name: asString(formData.get("name")),
    email: asString(formData.get("email")),
    phone: asOptionalString(formData.get("phone")),
    whatsapp: currentProfile.whatsapp,
    agency: asOptionalString(formData.get("agency")),
    role: asOptionalString(formData.get("role")),
    bio: currentProfile.bio,
    avatarUrl: asOptionalString(formData.get("avatarUrl")),
    coverUrl: asOptionalString(formData.get("coverUrl")),
    timezone: asString(formData.get("timezone")),
    language: asString(formData.get("language")),
    notifications: currentProfile.notifications
  });

  if (!payloadResult.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      errors: payloadResult.error.flatten().fieldErrors
    };
  }

  const nextProfile = await persistProfile({
    ...payloadResult.data,
    id: parsedUserId.data.userId
  });

  // Also sync core user fields (name, image) back to Better Auth so the
  // session header reflects the latest profile information.
  try {
    await auth.api.updateUser({
      body: {
        name: nextProfile.name,
        image: nextProfile.avatarUrl
      },
      headers: await headers()
    });
  } catch (error) {
    console.error("Failed to sync auth user profile:", error);
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Profile updated successfully.",
    data: nextProfile
  };
}
