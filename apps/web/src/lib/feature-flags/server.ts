import "server-only";

import {
  type FeatureFlagKey,
  type FeatureFlags,
  resolveFeatureFlags,
  parseFeatureFlagCsv,
} from "@leadlah/core";

let cached: FeatureFlags | null = null;

export function getServerFeatureFlags(): FeatureFlags {
  if (cached) {
    return cached;
  }

  const enabled = parseFeatureFlagCsv(
    process.env.LEADLAH_FEATURE_FLAGS ??
      process.env.NEXT_PUBLIC_LEADLAH_FEATURE_FLAGS,
  );

  cached = resolveFeatureFlags(enabled);
  return cached;
}

export function isFeatureEnabled(flag: FeatureFlagKey) {
  return Boolean(getServerFeatureFlags()[flag]);
}
