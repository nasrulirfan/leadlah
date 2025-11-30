import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";
import type { Session } from "./auth";

export async function requireSession(): Promise<Session> {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}
