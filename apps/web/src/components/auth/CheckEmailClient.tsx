"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EmailType = "verify" | "reset";

function normalizeType(value: string | undefined): EmailType {
  return value === "reset" ? "reset" : "verify";
}

export function CheckEmailClient(props: { type?: string; email?: string }) {
  const type = useMemo(() => normalizeType(props.type), [props.type]);
  const [email, setEmail] = useState(props.email ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const title = type === "reset" ? "Check your email" : "Verify your email";
  const description =
    type === "reset"
      ? "If an account exists for this email, we sent a reset link."
      : "We sent a verification link to activate your account.";

  async function resend() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email to resend the link.");
      return;
    }

    setError(null);
    setStatus("sending");

    try {
      if (type === "reset") {
        const { error: resetError } = await authClient.requestPasswordReset({
          email: trimmed,
          redirectTo: "/reset-password",
        });
        if (resetError) {
          console.error("Password reset resend error:", resetError);
        }
      } else {
        const { error: verifyError } = await authClient.sendVerificationEmail({
          email: trimmed,
          callbackURL: "/dashboard",
        });
        if (verifyError) {
          console.error("Verification resend error:", verifyError);
        }
      }
    } finally {
      setStatus("sent");
      if (typeof window !== "undefined") {
        const nextUrl = `/check-email?type=${encodeURIComponent(type)}&email=${encodeURIComponent(trimmed)}`;
        window.history.replaceState(null, "", nextUrl);
      }
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
        {status === "sent" && (
          <p className="text-sm text-muted-foreground">
            If the email exists, a new link is on the way. Check spam/junk folders too.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={resend} disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : type === "reset" ? "Resend reset link" : "Resend verification link"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
