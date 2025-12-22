import type { ValueTransformer } from "typeorm";

export const numericTransformer: ValueTransformer = {
  to: (value) => value,
  from: (value) => {
    if (value === null || value === undefined) {
      return value;
    }
    return typeof value === "string" ? Number(value) : value;
  }
};

