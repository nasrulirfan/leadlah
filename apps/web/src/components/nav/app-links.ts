import type { LucideIcon } from "lucide-react";
import { Calculator, CalendarClock, CreditCard, LayoutDashboard, ListChecks, TrendingUp, User } from "lucide-react";

export type AppNavLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const appNavLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Metrics & pulse",
    icon: LayoutDashboard
  },
  {
    href: "/appointments",
    label: "Appointments",
    description: "Viewings & schedule",
    icon: CalendarClock
  },
  {
    href: "/listings",
    label: "Listings",
    description: "Inventory & workflow",
    icon: ListChecks
  },
  {
    href: "/calculators",
    label: "Calculators",
    description: "Financial tools",
    icon: Calculator
  },
  {
    href: "/performance",
    label: "Performance",
    description: "Targets & expenses",
    icon: TrendingUp
  },
  {
    href: "/profile",
    label: "Profile",
    description: "Contact & presence",
    icon: User
  },
  {
    href: "/billing",
    label: "Billing",
    description: "Plan & invoices",
    icon: CreditCard
  }
] as const satisfies ReadonlyArray<AppNavLink>;
