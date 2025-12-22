import { requireSession } from "@/lib/session";
import { fetchProfile } from "@/data/profile";
import { fetchAppointmentReminders } from "@/data/reminders";
import { fetchListings } from "@/data/listings";
import { fetchProcessLogs } from "@/data/process-logs";
import { ProcessStage } from "@leadlah/core";
import { AppointmentsClient } from "./client";

export default async function AppointmentsPage() {
  const session = await requireSession();
  const profile = await fetchProfile(session.user.id);
  const appointments = await fetchAppointmentReminders(session.user.id);
  const listings = await fetchListings();
  const logs = await fetchProcessLogs(listings.map((listing) => listing.id));
  const viewingStages = listings
    .map((listing) => {
      const entry = (logs[listing.id] ?? []).find((item) => item.stage === ProcessStage.VIEWING_RECORD);
      if (!entry?.viewings?.length) {
        return null;
      }
      return {
        listingId: listing.id,
        listingName: listing.propertyName,
        notes: entry.notes,
        actor: entry.actor,
        completedAt: entry.completedAt,
        successfulBuyerId: entry.successfulBuyerId,
        viewings: entry.viewings,
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  return (
    <AppointmentsClient
      initialAppointments={appointments}
      initialViewingStages={viewingStages}
      timezone={profile.timezone}
    />
  );
}
