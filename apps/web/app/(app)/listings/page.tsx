import ListingsClient from "./client";
import { requireSession } from "@/lib/session";
import { fetchListings } from "@/data/listings";
import { fetchProcessLogs } from "@/data/process-logs";

export default async function ListingsPage() {
  const session = await requireSession();
  const listings = await fetchListings();
  const logs = await fetchProcessLogs(listings.map((listing) => listing.id));
  return (
    <ListingsClient
      userId={session.user.id}
      initialListings={listings}
      initialProcessLogs={logs}
    />
  );
}
