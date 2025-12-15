"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, UploadCloud, XCircle } from "lucide-react";
import type { UserProfile } from "@leadlah/core";

import { updateProfile, type ProfileFormState } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProfileFormProps = {
  profile: UserProfile;
};

const timezoneOptions = [
  { value: "Asia/Kuala_Lumpur", label: "GMT+8 • Kuala Lumpur" },
  { value: "Asia/Singapore", label: "GMT+8 • Singapore" },
  { value: "Asia/Hong_Kong", label: "GMT+8 • Hong Kong" },
  { value: "Asia/Bangkok", label: "GMT+7 • Bangkok" }
];

const languageOptions = [
  { value: "English (Malaysia)", label: "English (Malaysia)" },
  { value: "Bahasa Melayu", label: "Bahasa Melayu" },
  { value: "Chinese", label: "Chinese (Mandarin)" }
];

export function ProfileForm({ profile }: ProfileFormProps) {
  const initialProfileState: ProfileFormState = { status: "idle" };
  const [state, formAction] = useFormState(updateProfile, initialProfileState);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl ?? "");
  const [timezone, setTimezone] = useState(profile.timezone);
  const [language, setLanguage] = useState(profile.language);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarPreview(profile.avatarUrl ?? "");
    setTimezone(profile.timezone);
    setLanguage(profile.language);
  }, [profile]);

  useEffect(() => {
    if (state.status === "success" && state.data) {
      setAvatarPreview(state.data.avatarUrl ?? "");
      setTimezone(state.data.timezone);
      setLanguage(state.data.language);
    }
  }, [state]);

  const initials = useMemo(() => {
    return profile.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "LL";
  }, [profile.name]);

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setAvatarPreview("");
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={profile.id} />
      <input type="hidden" name="coverUrl" value={profile.coverUrl ?? ""} />
      <input type="hidden" name="timezone" value={timezone} />
      <input type="hidden" name="language" value={language} />
      <input type="hidden" name="avatarUrl" value={avatarPreview} />

      <Card className="shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Share who you are with leads and owners. These details power reminders, WhatsApp templates, and branded reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarField
            avatarPreview={avatarPreview}
            initials={initials}
            fileInputRef={fileInputRef}
            onUpload={handleAvatarUpload}
            onRemove={handleAvatarRemove}
          />

          {state.status === "error" && state.message && (
            <FormBanner tone="error" message={state.message} />
          )}
          {state.status === "success" && state.message && (
            <FormBanner tone="success" message={state.message} />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Full name" name="name" state={state} required>
              <Input name="name" id="name" defaultValue={profile.name} placeholder="e.g. Alicia Rahman" />
            </Field>
            <Field label="Work email" name="email" state={state} required>
              <Input
                name="email"
                id="email"
                type="email"
                defaultValue={profile.email}
                placeholder="you@example.com"
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Mobile" name="phone" state={state}>
              <Input
                name="phone"
                id="phone"
                defaultValue={profile.phone}
                placeholder="+60 12-555 4455"
              />
            </Field>
            <Field label="REN role/title" name="role" state={state}>
              <Input name="role" id="role" defaultValue={profile.role} placeholder="Senior REN" />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Agency" name="agency" state={state}>
              <Input
                name="agency"
                id="agency"
                defaultValue={profile.agency}
                placeholder="Your agency name"
              />
            </Field>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError name="timezone" state={state} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-1">
            <Field label="Bio" name="bio" state={state}>
              <Textarea
                name="bio"
                id="bio"
                defaultValue={profile.bio}
                placeholder="Let leads know what you specialise in."
                className="min-h-[120px]"
              />
            </Field>
          </div>
          <div>
            <Label className="text-sm font-semibold">Notifications</Label>
            <p className="text-xs text-muted-foreground">Personalise how LeadLah nudges you to keep deals moving.</p>
            <div className="mt-3 space-y-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
              <NotificationToggle
                id="notifications.reminders"
                name="notifications.reminders"
                title="Critical reminders"
                description="Expiring listings, exclusive appointments, tenancy renewals."
                defaultChecked={profile.notifications.reminders}
              />
              <NotificationToggle
                id="notifications.smartDigest"
                name="notifications.smartDigest"
                title="Weekly digest"
                description="Consolidated KPI + reminder email every Monday 7am."
                defaultChecked={profile.notifications.smartDigest}
              />
              <NotificationToggle
                id="notifications.productUpdates"
                name="notifications.productUpdates"
                title="Product tips"
                description="Occasional product education and feature announcements."
                defaultChecked={profile.notifications.productUpdates}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-border/70 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Changes sync instantly to reminder emails, owner reports, and calculators receipts.
          </div>
          <SubmitButton />
        </CardFooter>
      </Card>
    </form>
  );
}

function AvatarField({
  avatarPreview,
  initials,
  fileInputRef,
  onUpload,
  onRemove
}: {
  avatarPreview: string;
  initials: string;
  fileInputRef: RefObject<HTMLInputElement>;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-dashed border-border/60 bg-muted/40 p-4">
      <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-border bg-background shadow-inner">
        {avatarPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarPreview} alt="Profile avatar" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
            {initials}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-medium text-foreground">Profile photo</p>
        <p className="text-xs text-muted-foreground">JPG or PNG, max 2 MB. Square images look best on owner reports.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            aria-label="Upload profile photo"
            onChange={onUpload}
          />
          <Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud className="mr-1.5 h-4 w-4" />
            Upload new
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={!avatarPreview}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  children,
  state,
  required
}: {
  label: string;
  name: string;
  children: ReactNode;
  state: ProfileFormState;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      <FieldError name={name} state={state} />
    </div>
  );
}

function FieldError({
  name,
  state
}: {
  name: string;
  state: ProfileFormState;
}) {
  const message = state.errors?.[name]?.[0];
  if (!message) {
    return null;
  }
  return <p className="text-sm text-destructive">{message}</p>;
}

function NotificationToggle({
  id,
  name,
  title,
  description,
  defaultChecked
}: {
  id: string;
  name: string;
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-transparent bg-background/90 px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} name={name} defaultChecked={defaultChecked} />
    </div>
  );
}

function FormBanner({ message, tone }: { message: string; tone: "success" | "error" }) {
  const isSuccess = tone === "success";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-900"
      )}
    >
      {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span>{message}</span>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Save changes
    </Button>
  );
}
