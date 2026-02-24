"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, ensureAuthReady } from "@/lib/auth";
import { requestApi } from "@/lib/api";

type ActionState = { error?: string };

const signUpSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(6).max(40),
  agency: z.string().min(2).max(80),
  timezone: z.string().min(2),
  language: z.string().min(2),
});

export async function signInWithEmail(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await ensureAuthReady();
    await auth.api.signInEmail({
      body: { email, password }
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to sign in. Please try again." };
  }

  redirect("/dashboard");
}

export async function signUpWithEmail(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    phone: String(formData.get("phone") ?? "").trim(),
    agency: String(formData.get("agency") ?? "").trim(),
    timezone: String(formData.get("timezone") ?? "").trim(),
    language: String(formData.get("language") ?? "").trim(),
  });

  if (!parsed.success) {
    return { error: "Please fill in all required details to create your account." };
  }

  try {
    await ensureAuthReady();
    const created = await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
    });

    const userId = created?.user?.id ? String(created.user.id) : "";
    if (!userId) {
      return { error: "Account created, but we couldn't set up your profile. Please sign in and try again." };
    }

    await requestApi(`/profiles/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        agency: parsed.data.agency,
        timezone: parsed.data.timezone,
        language: parsed.data.language,
        notifications: { reminders: true, smartDigest: true, productUpdates: false },
      }),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create your account. Please try again." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  await ensureAuthReady();
  await auth.api.signOut({
    headers: await headers()
  });

  redirect("/sign-in");
}
