"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, ensureAuthReady } from "@/lib/auth";

type ActionState = { error?: string };

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
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }

  try {
    await ensureAuthReady();
    await auth.api.signUpEmail({
      body: { name, email, password }
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
