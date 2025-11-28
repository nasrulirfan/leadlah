import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind classes with conditional helpers (shadcn convention).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
