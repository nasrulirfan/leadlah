import type { ProcessLogEntry, ProcessStage, ViewingCustomer } from "@leadlah/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type UpdateProcessPayload = {
  stage: ProcessStage;
  notes?: string;
  actor?: string;
  completed?: boolean;
  viewings?: ViewingCustomer[];
  successfulBuyerId?: string;
};

const toViewingCustomer = (viewing: ViewingCustomer): ViewingCustomer => ({
  ...viewing,
  viewedAt: viewing.viewedAt ? new Date(viewing.viewedAt) : undefined
});

const toProcessLogEntry = (entry: ProcessLogEntry): ProcessLogEntry => ({
  ...entry,
  completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined,
  viewings: entry.viewings?.map(toViewingCustomer)
});

export async function updateProcessStage(listingId: string, payload: UpdateProcessPayload) {
  const response = await fetch(`${API_BASE_URL}/process/${listingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to update the process stage.");
  }

  const data = (await response.json()) as ProcessLogEntry;
  const result = toProcessLogEntry(data);

  if (payload.viewings && (!result.viewings || result.viewings.length === 0)) {
    result.viewings = payload.viewings.map((viewing) => ({
      ...viewing,
      viewedAt: viewing.viewedAt ? new Date(viewing.viewedAt) : undefined
    }));
  }

  if (payload.successfulBuyerId && !result.successfulBuyerId) {
    result.successfulBuyerId = payload.successfulBuyerId;
  }

  return result;
}
