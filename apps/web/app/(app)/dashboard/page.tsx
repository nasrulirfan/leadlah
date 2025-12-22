import { requireSession } from "@/lib/session";
import {
  fetchDashboardActivities,
  fetchDashboardPerformance,
  fetchDashboardProfile,
  fetchDashboardReminders,
  fetchListingStatusCounts,
} from "@/data/dashboard";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const session = await requireSession();
  const profile = await fetchDashboardProfile(session.user.id);

  const [
    listingCounts,
    reminders,
    { performanceData, monthlyData },
    activities,
  ] = await Promise.all([
    fetchListingStatusCounts(),
    fetchDashboardReminders(session.user.id, profile.timezone),
    fetchDashboardPerformance(session.user.id),
    fetchDashboardActivities(session.user.id),
  ]);

  return (
    <DashboardClient
      listingCounts={listingCounts}
      reminders={reminders}
      timezone={profile.timezone}
      activities={activities}
      performanceData={performanceData}
      monthlyData={monthlyData}
    />
  );
}
