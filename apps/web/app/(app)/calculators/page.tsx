import CalculatorsClient from "./client";
import { requireSession } from "@/lib/session";

export default async function CalculatorsPage() {
  await requireSession();
  return <CalculatorsClient />;
}
