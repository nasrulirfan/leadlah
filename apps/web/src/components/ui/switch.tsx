"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <label className={cn("relative inline-flex h-6 w-11 cursor-pointer items-center", className)}>
    <input
      type="checkbox"
      className="peer sr-only"
      ref={ref}
      {...props}
    />
    <span className="absolute inset-0 rounded-full bg-muted transition peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
    <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-background shadow transition peer-checked:translate-x-5" />
  </label>
));
Switch.displayName = "Switch";
