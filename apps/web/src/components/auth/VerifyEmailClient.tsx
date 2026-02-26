"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function normalizeCallbackPath(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  return trimmed;
}

export function VerifyEmailClient(props: { token?: string; callbackURL?: string }) {
  const token = typeof props.token === "string" ? props.token : "";
  const callbackURL = useMemo(() => normalizeCallbackPath(props.callbackURL) ?? "/dashboard", [props.callbackURL]);

  const [state, setState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setState("verifying");

    authClient
      .verifyEmail({ query: { token } })
      .then(({ error: verifyError }) => {
        if (cancelled) return;
        if (verifyError) {
          setError(verifyError.message || "Unable to verify your email.");
          setState("error");
          return;
        }
        setState("success");
        if (typeof window !== "undefined") {
          window.location.assign(callbackURL);
        }
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Unable to verify your email.");
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token, callbackURL]);

  if (!token) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>Missing verification token. Request a new verification email.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/check-email?type=verify">Resend verification</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          {state === "verifying" && "Verifying your email address…"}
          {state === "success" && "Email verified. Redirecting…"}
          {state === "error" && "We couldn’t verify that link."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/check-email?type=verify">Resend verification</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
