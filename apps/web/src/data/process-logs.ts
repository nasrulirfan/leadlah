import { ProcessLogEntry, ProcessStage } from "@leadlah/core";
import { db } from "@/lib/db";

type ProcessLogRow = {
  id: string;
  listingId: string;
  stage: ProcessStage;
  notes: string | null;
  actor: string | null;
  completedAt: string | Date | null;
};

const toEntry = (row: ProcessLogRow): ProcessLogEntry => ({
  stage: row.stage,
  notes: row.notes ?? undefined,
  actor: row.actor ?? undefined,
  completedAt: row.completedAt ? new Date(row.completedAt) : undefined
});

const stageOrder = Object.values(ProcessStage);
const sortByStage = (entries: ProcessLogEntry[]) => {
  return [...entries].sort(
    (a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage)
  );
};

export async function fetchProcessLogs(listingIds: string[]): Promise<Record<string, ProcessLogEntry[]>> {
  if (!listingIds.length) {
    return {};
  }

  const result = await db.query<ProcessLogRow>(
    `
      SELECT id, "listingId", stage, notes, actor, "completedAt"
      FROM "process_logs"
      WHERE "listingId" = ANY($1::uuid[])
    `,
    [listingIds]
  );

  const grouped: Record<string, ProcessLogEntry[]> = {};
  for (const row of result.rows) {
    if (!grouped[row.listingId]) {
      grouped[row.listingId] = [];
    }
    grouped[row.listingId].push(toEntry(row));
  }

  for (const key of Object.keys(grouped)) {
    grouped[key] = sortByStage(grouped[key]);
  }

  return grouped;
}

export async function fetchProcessLogForListing(listingId: string): Promise<ProcessLogEntry[]> {
  if (!listingId) {
    return [];
  }

  const result = await db.query<ProcessLogRow>(
    `
      SELECT id, "listingId", stage, notes, actor, "completedAt"
      FROM "process_logs"
      WHERE "listingId" = $1
    `,
    [listingId]
  );

  return sortByStage(result.rows.map(toEntry));
}

