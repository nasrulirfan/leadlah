import type { LucideIcon } from "lucide-react";
import { Calculator, CreditCard, LayoutDashboard, ListChecks } from "lucide-react";

export type AppNavLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const appNavLinks: AppNavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Metrics & pulse",
    icon: LayoutDashboard
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
    href: "/billing",
    label: "Billing",
    description: "Plan & invoices",
    icon: CreditCard
  }
];
