import { ProcessLogEntry, ProcessStage, ViewingCustomer } from "@leadlah/core";
import { db } from "@/lib/db";

type ProcessLogRow = {
  id: string;
  listingId: string;
  stage: ProcessStage;
  notes: string | null;
  actor: string | null;
  completedAt: string | Date | null;
};

type ProcessViewingRow = {
  id: string;
  processLogId: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  viewedAt: string | Date | null;
  isSuccessfulBuyer: boolean;
};

const toViewingCustomer = (row: ProcessViewingRow): ViewingCustomer => ({
  id: row.id,
  name: row.name,
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  notes: row.notes ?? undefined,
  viewedAt: row.viewedAt ? new Date(row.viewedAt) : undefined
});

const toEntry = (row: ProcessLogRow, viewings: ProcessViewingRow[]): ProcessLogEntry => ({
  stage: row.stage,
  notes: row.notes ?? undefined,
  actor: row.actor ?? undefined,
  completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
  viewings: viewings.length ? viewings.map(toViewingCustomer) : undefined,
  successfulBuyerId: viewings.find((viewing) => viewing.isSuccessfulBuyer)?.id
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

  const logIds = result.rows.map((row) => row.id);
  const viewingResult = logIds.length
    ? await db.query<ProcessViewingRow>(
        `
        SELECT id, "processLogId", name, phone, email, notes, "viewedAt", "isSuccessfulBuyer"
        FROM "process_viewings"
        WHERE "processLogId" = ANY($1::uuid[])
        ORDER BY COALESCE("viewedAt", '1970-01-01 00:00:00+00'::timestamptz) ASC, "createdAt" ASC
      `,
        [logIds]
      )
    : { rows: [] };

  const viewingsByLog: Record<string, ProcessViewingRow[]> = {};
  for (const viewing of viewingResult.rows) {
    if (!viewingsByLog[viewing.processLogId]) {
      viewingsByLog[viewing.processLogId] = [];
    }
    viewingsByLog[viewing.processLogId].push(viewing);
  }

  const grouped: Record<string, ProcessLogEntry[]> = {};
  for (const row of result.rows) {
    if (!grouped[row.listingId]) {
      grouped[row.listingId] = [];
    }
    grouped[row.listingId].push(toEntry(row, viewingsByLog[row.id] ?? []));
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

  const logIds = result.rows.map((row) => row.id);
  const viewingResult = logIds.length
    ? await db.query<ProcessViewingRow>(
        `
        SELECT id, "processLogId", name, phone, email, notes, "viewedAt", "isSuccessfulBuyer"
        FROM "process_viewings"
        WHERE "processLogId" = ANY($1::uuid[])
        ORDER BY COALESCE("viewedAt", '1970-01-01 00:00:00+00'::timestamptz) ASC, "createdAt" ASC
      `,
        [logIds]
      )
    : { rows: [] };

  const viewingsByLog: Record<string, ProcessViewingRow[]> = {};
  for (const viewing of viewingResult.rows) {
    if (!viewingsByLog[viewing.processLogId]) {
      viewingsByLog[viewing.processLogId] = [];
    }
    viewingsByLog[viewing.processLogId].push(viewing);
  }

  return sortByStage(result.rows.map((row) => toEntry(row, viewingsByLog[row.id] ?? [])));
}
