export const FEATURE_FLAG_KEYS = ["performance.reports"] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  "performance.reports": false
};

export const isFeatureFlagKey = (value: string): value is FeatureFlagKey =>
  (FEATURE_FLAG_KEYS as readonly string[]).includes(value);

export const parseFeatureFlagCsv = (value: string | null | undefined) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const resolveFeatureFlags = (enabled: readonly string[]): FeatureFlags => {
  const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };

  for (const entry of enabled) {
    if (isFeatureFlagKey(entry)) {
      flags[entry] = true;
    }
  }

  return flags;
};

export const resolveFeatureFlagsFromCsv = (value: string | null | undefined) =>
  resolveFeatureFlags(parseFeatureFlagCsv(value));
