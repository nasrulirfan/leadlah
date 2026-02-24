import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  type FeatureFlagKey,
  type FeatureFlags,
  resolveFeatureFlagsFromCsv,
} from "@leadlah/core";

@Injectable()
export class FeatureFlagsService {
  private readonly flags: FeatureFlags;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    this.flags = resolveFeatureFlagsFromCsv(
      this.config.get<string>("LEADLAH_FEATURE_FLAGS"),
    );
  }

  isEnabled(flag: FeatureFlagKey) {
    return Boolean(this.flags[flag]);
  }

  getAll() {
    return this.flags;
  }
}
