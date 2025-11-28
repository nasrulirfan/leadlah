import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        success: "border-transparent bg-emerald-100 text-emerald-700",
        warning: "border-transparent bg-amber-100 text-amber-800",
        info: "border-transparent bg-sky-100 text-sky-700"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

type LegacyTone = "neutral" | "success" | "warning" | "danger" | "info";
const toneToVariant: Record<LegacyTone, VariantProps<typeof badgeVariants>["variant"]> = {
  neutral: "secondary",
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "info"
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  tone?: LegacyTone;
}

export function Badge({ className, variant, tone, ...props }: BadgeProps) {
  const resolvedVariant = variant ?? (tone ? toneToVariant[tone] : "default");
  return (
    <span className={cn(badgeVariants({ variant: resolvedVariant }), className)} {...props} />
  );
}
