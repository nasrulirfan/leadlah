type PgRow = Record<string, any>;

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
};

const toIsoString = (value: string | Date | null | undefined) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const dateValue = new Date(value);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
};

export const serializeTargetRow = (row: PgRow) => ({
  id: row.id,
  userId: row.user_id,
  year: row.year,
  month: row.month ?? null,
  targetUnits: toNumber(row.target_units),
  targetCommission: toNumber(row.target_income),
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at)
});

export const serializeExpenseRow = (row: PgRow) => ({
  id: row.id,
  userId: row.user_id,
  category: row.category,
  amount: toNumber(row.amount),
  description: row.description,
  date: toIsoString(row.date),
  receiptUrl: row.receipt_url ?? null,
  createdAt: toIsoString(row.created_at),
  updatedAt: toIsoString(row.updated_at)
});
