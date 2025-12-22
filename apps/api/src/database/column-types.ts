export const timestampColumnType =
  process.env.NODE_ENV === "test" ? "datetime" : "timestamptz";

export const jsonColumnType = process.env.NODE_ENV === "test" ? "simple-json" : "jsonb";

