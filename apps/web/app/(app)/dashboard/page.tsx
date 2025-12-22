import { requireSession } from "@/lib/session";
import { fetchDashboardReminders } from "@/data/reminders";
import { fetchProfile } from "@/data/profile";
import { fetchListingStatusCounts } from "@/data/listings";
import {
  fetchDashboardActivities,
  fetchDashboardPerformance,
} from "@/data/dashboard";
import { DashboardClient } from "./client";

export default async function DashboardPage() {
  const session = await requireSession();
  const profile = await fetchProfile(session.user.id);
  const listingCounts = await fetchListingStatusCounts();
  const reminders = await fetchDashboardReminders(
    session.user.id,
    profile.timezone,
  );
  const [{ performanceData, monthlyData }, activities] = await Promise.all([
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
