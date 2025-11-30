import ListingsClient from "./client";
import { requireSession } from "@/lib/session";
import { fetchListings } from "@/data/listings";
import { fetchProcessLogs } from "@/data/process-logs";

export default async function ListingsPage() {
  await requireSession();
  const listings = await fetchListings();
  const logs = await fetchProcessLogs(listings.map((listing) => listing.id));
  return <ListingsClient initialListings={listings} initialProcessLogs={logs} />;
}
