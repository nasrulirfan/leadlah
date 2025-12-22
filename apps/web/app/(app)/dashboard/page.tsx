import { requireSession } from "@/lib/session";
import { fetchDashboardReminders } from "@/data/reminders";
import { fetchProfile } from "@/data/profile";
import { fetchListingStatusCounts } from "@/data/listings";
import { DashboardClient } from "./client";

// Mock performance data - in production, fetch from API
async function getPerformanceData() {
  // These would come from your performance API
  return {
    target: 500000,
    commission: 180000,
    expenses: 32000,
    netIncome: 148000,
    unitsTarget: 12,
    unitsClosed: 5,
  };
}

// Generate monthly data for the chart
function generateMonthlyData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => ({
    month,
    commission: Math.floor(Math.random() * 50000) + 10000 + (index * 5000),
    expenses: Math.floor(Math.random() * 8000) + 2000,
    target: 40000,
  }));
}

export default async function DashboardPage() {
  const session = await requireSession();
  const profile = await fetchProfile(session.user.id);
  const listingCounts = await fetchListingStatusCounts();
  const reminders = await fetchDashboardReminders(session.user.id, profile.timezone);
  const performanceData = await getPerformanceData();
  const monthlyData = generateMonthlyData();

  return (
    <DashboardClient
      listingCounts={listingCounts}
      reminders={reminders}
      timezone={profile.timezone}
      performanceData={performanceData}
      monthlyData={monthlyData}
    />
  );
}
