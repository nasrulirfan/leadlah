import { requireSession } from "@/lib/session";
import { PerformanceClient } from "./client";

export default async function PerformancePage() {
  await requireSession();

  return <PerformanceClient />;
}
