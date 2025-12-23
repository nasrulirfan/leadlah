type DateTransformer = {
  to: (value: Date | string | null | undefined) => string | null;
  from: (value: string | Date | null) => Date | null;
};

const formatDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const parseDateOnly = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes("T")) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const dateTransformer: DateTransformer = {
  to(value) {
    if (value == null) {
      return null;
    }

    if (typeof value === "string") {
      return value.includes("T") ? formatDateOnly(new Date(value)) : value.slice(0, 10);
    }

    return formatDateOnly(value);
  },
  from(value) {
    if (value == null) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    return parseDateOnly(value);
  }
};

