import type {
  OwnerViewToken,
  ProcessLogEntry,
  ProcessStage,
  ViewingCustomer,
} from "@leadlah/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type UpdateProcessPayload = {
  userId?: string;
  stage: ProcessStage;
  notes?: string;
  actor?: string;
  completed?: boolean;
  viewings?: ViewingCustomer[];
  successfulBuyerId?: string;
};

const toViewingCustomer = (viewing: ViewingCustomer): ViewingCustomer => ({
  ...viewing,
  viewedAt: viewing.viewedAt ? new Date(viewing.viewedAt) : undefined,
});

const toProcessLogEntry = (entry: ProcessLogEntry): ProcessLogEntry => ({
  ...entry,
  completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined,
  viewings: entry.viewings?.map(toViewingCustomer),
});

export async function updateProcessStage(
  listingId: string,
  payload: UpdateProcessPayload,
) {
  const response = await fetch(`${API_BASE_URL}/process/${listingId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
      viewedAt: viewing.viewedAt ? new Date(viewing.viewedAt) : undefined,
    }));
  }

  if (payload.successfulBuyerId && !result.successfulBuyerId) {
    result.successfulBuyerId = payload.successfulBuyerId;
  }

  return result;
}

export async function fetchOwnerLink(
  listingId: string,
): Promise<OwnerViewToken> {
  const response = await fetch(
    `${API_BASE_URL}/process/${listingId}/owner-link`,
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to generate owner link.");
  }

  const data = (await response.json()) as OwnerViewToken & {
    expiresAt: string;
  };
  return {
    ...data,
    expiresAt: new Date(data.expiresAt),
  };
}
