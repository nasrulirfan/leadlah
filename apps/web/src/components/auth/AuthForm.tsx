"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActionState = { error?: string };

const initialState: ActionState = {};

const timezoneOptions = [
  { value: "Asia/Kuala_Lumpur", label: "GMT+8 • Kuala Lumpur" },
  { value: "Asia/Singapore", label: "GMT+8 • Singapore" },
  { value: "Asia/Hong_Kong", label: "GMT+8 • Hong Kong" },
  { value: "Asia/Bangkok", label: "GMT+7 • Bangkok" },
];

const languageOptions = [
  { value: "English (Malaysia)", label: "English (Malaysia)" },
  { value: "Bahasa Melayu", label: "Bahasa Melayu" },
  { value: "Chinese", label: "Chinese (Mandarin)" },
];

export function AuthForm() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [timezone, setTimezone] = useState("Asia/Kuala_Lumpur");
  const [language, setLanguage] = useState("English (Malaysia)");
  const [signInState, signInAction] = useFormState<ActionState, FormData>(signInWithEmail, initialState);
  const [signUpState, signUpAction] = useFormState<ActionState, FormData>(signUpWithEmail, initialState);

  const currentState = mode === "sign-in" ? signInState : signUpState;
  const action = mode === "sign-in" ? signInAction : signUpAction;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-full bg-muted p-1 text-sm font-semibold text-muted-foreground">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`flex-1 rounded-full px-4 py-2 transition ${
            mode === "sign-in" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`flex-1 rounded-full px-4 py-2 transition ${
            mode === "sign-up" ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
          }`}
        >
          Create account
        </button>
      </div>

      <form action={action} className="space-y-4">
        {mode === "sign-up" && (
          <>
            <input type="hidden" name="timezone" value={timezone} />
            <input type="hidden" name="language" value={language} />
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full name
              </label>
              <Input id="name" name="name" placeholder="Alicia Tan" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Mobile
              </label>
              <Input id="phone" name="phone" placeholder="+60 12-555 4455" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="agency" className="text-sm font-medium text-foreground">
                Agency
              </label>
              <Input id="agency" name="agency" placeholder="Your agency name" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="timezone" className="text-sm font-medium text-foreground">
                Timezone
              </label>
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
            </div>
            <div className="space-y-2">
              <label htmlFor="language" className="text-sm font-medium text-foreground">
                Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Work email
          </label>
          <Input id="email" name="email" type="email" placeholder="you@agency.com" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input id="password" name="password" type="password" minLength={8} placeholder="••••••••" required />
          <p className="text-xs text-muted-foreground">Minimum 8 characters. Sessions stay encrypted in secure cookies.</p>
        </div>
        {currentState?.error && <p className="text-sm font-medium text-red-600">{currentState.error}</p>}
        <Button type="submit" className="w-full">
          {mode === "sign-in" ? "Sign in to LeadLah" : "Create my account"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        By continuing you agree to the billing and owner transparency policies. You can revoke sessions anytime from your
        dashboard.
      </p>
    </div>
  );
}
