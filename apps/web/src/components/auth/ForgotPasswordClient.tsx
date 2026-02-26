"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Email is required.");
      return;
    }

    setError(null);
    setStatus("submitting");

    try {
      const { error: apiError } = await authClient.requestPasswordReset({
        email: trimmed,
        redirectTo: "/reset-password",
      });

      if (apiError) {
        console.error("Forgot password error:", apiError);
      }
    } finally {
      if (typeof window !== "undefined") {
        window.location.assign(`/check-email?type=reset&email=${encodeURIComponent(trimmed)}`);
      }
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>We’ll email you a secure reset link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@agency.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Sending…" : "Send reset link"}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/sign-in">Back to sign in</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
