import type { ProcessLogEntry, ViewingCustomer } from "@leadlah/core";
import { requestApi } from "@/lib/api";

const toViewingCustomer = (viewing: ViewingCustomer): ViewingCustomer => ({
  ...viewing,
  viewedAt: viewing.viewedAt ? new Date(viewing.viewedAt) : undefined,
});

const toEntry = (entry: ProcessLogEntry): ProcessLogEntry => ({
  ...entry,
  completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined,
  viewings: entry.viewings?.map(toViewingCustomer),
});

export async function fetchProcessLogs(
  listingIds: string[],
): Promise<Record<string, ProcessLogEntry[]>> {
  if (!listingIds.length) {
    return {};
  }

  const pairs = await Promise.all(
    listingIds.map(async (listingId) => {
      const entries = await requestApi<ProcessLogEntry[]>(`/process/${listingId}`);
      return [listingId, entries.map(toEntry)] as const;
    }),
  );

  return pairs.reduce<Record<string, ProcessLogEntry[]>>((acc, [listingId, entries]) => {
    acc[listingId] = entries;
    return acc;
  }, {});
}

export async function fetchProcessLogForListing(
  listingId: string,
): Promise<ProcessLogEntry[]> {
  if (!listingId) {
    return [];
  }
  const entries = await requestApi<ProcessLogEntry[]>(`/process/${listingId}`);
  return entries.map(toEntry);
}
