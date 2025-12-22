export type DashboardActivityType =
  | "listing"
  | "sale"
  | "lead"
  | "reminder"
  | "target"
  | "expense";

export type DashboardActivity = {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  time: string;
};
