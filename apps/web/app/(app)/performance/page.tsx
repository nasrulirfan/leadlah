import { requireSession } from "@/lib/session";
import { PerformanceClient } from "./client";
import { getServerFeatureFlags } from "@/lib/feature-flags/server";

export default async function PerformancePage() {
  await requireSession();
  const flags = getServerFeatureFlags();

  return <PerformanceClient reportsEnabled={flags["performance.reports"]} />;
}
