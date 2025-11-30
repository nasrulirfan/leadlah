import type { ProcessLogEntry, ProcessStage } from "@leadlah/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type UpdateProcessPayload = {
  stage: ProcessStage;
  notes?: string;
  actor?: string;
  completed?: boolean;
};

const toProcessLogEntry = (entry: ProcessLogEntry): ProcessLogEntry => ({
  ...entry,
  completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined
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
  return toProcessLogEntry(data);
}
