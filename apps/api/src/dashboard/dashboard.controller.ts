import { Controller, Get, Param, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get(":userId/activities")
  activities(@Param("userId") userId: string, @Query("limit") limit?: string) {
    const parsed = limit ? Number(limit) : NaN;
    const resolved = Number.isFinite(parsed)
      ? Math.min(50, Math.max(1, parsed))
      : 20;
    return this.service.activities(userId, resolved);
  }
}
