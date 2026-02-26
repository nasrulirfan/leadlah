"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function normalizeCallbackPath(value: string | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;
  return trimmed;
}

export function ResetPasswordClient(props: { token?: string; error?: string }) {
  const token = typeof props.token === "string" ? props.token : "";
  const error = typeof props.error === "string" ? props.error : "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  const isInvalidToken = error.toUpperCase() === "INVALID_TOKEN";

  const canSubmit = useMemo(() => {
    if (!token || isInvalidToken) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [token, isInvalidToken, newPassword, confirmPassword]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setFormError("Missing reset token. Please request a new reset link.");
      return;
    }

    if (isInvalidToken) {
      setFormError("This reset link is invalid or expired. Please request a new one.");
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError(null);
    setStatus("submitting");

    const { data, error: apiError } = await authClient.resetPassword({ token, newPassword });
    if (apiError) {
      setStatus("idle");
      setFormError(apiError.message || "Unable to reset your password.");
      return;
    }

    void data;
    if (typeof window !== "undefined") {
      window.location.assign("/sign-in?reset=1");
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isInvalidToken && (
          <p className="text-sm font-medium text-red-600">
            This reset link is invalid or expired. Please request a new one.
          </p>
        )}

        {!token && !isInvalidToken && (
          <p className="text-sm font-medium text-red-600">Missing reset token. Please request a new reset link.</p>
        )}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
              New password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              minLength={8}
              placeholder="••••••••"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              disabled={!token || isInvalidToken}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              minLength={8}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={!token || isInvalidToken}
            />
          </div>

          {formError && <p className="text-sm font-medium text-red-600">{formError}</p>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!canSubmit || status === "submitting"}>
              {status === "submitting" ? "Resetting…" : "Reset password"}
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
