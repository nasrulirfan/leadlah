import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RemindersService } from "./reminders.service";
import { ReminderType } from "@leadlah/core";
import { CreateReminderDto } from "./dto/create-reminder.dto";
import { ListRemindersQueryDto } from "./dto/list-reminders.query";
import { DashboardRemindersQueryDto } from "./dto/dashboard-reminders.query";
import { SyncPlatformExpiryDto } from "./dto/sync-platform-expiry.dto";

@Controller("reminders")
export class RemindersController {
  constructor(private readonly service: RemindersService) {}

  @Get()
  listLegacy(@Query("type") type?: ReminderType) {
    return this.service.listLegacy(type);
  }

  @Get(":userId")
  list(@Param("userId") userId: string, @Query() query: ListRemindersQueryDto) {
    return this.service.list(userId, query);
  }

  @Get(":userId/dashboard")
  dashboard(@Param("userId") userId: string, @Query() query: DashboardRemindersQueryDto) {
    return this.service.dashboard(userId, query.timeZone ?? "UTC");
  }

  @Post(":userId")
  create(@Param("userId") userId: string, @Body() body: CreateReminderDto) {
    return this.service.create(userId, body);
  }

  @Post(":userId/:reminderId/complete")
  complete(@Param("userId") userId: string, @Param("reminderId") reminderId: string) {
    return this.service.complete(userId, reminderId);
  }

  @Post(":userId/:reminderId/dismiss")
  dismiss(@Param("userId") userId: string, @Param("reminderId") reminderId: string) {
    return this.service.dismiss(userId, reminderId);
  }

  @Post(":userId/platform-expiry/:listingId/sync")
  syncPlatformExpiry(
    @Param("userId") userId: string,
    @Param("listingId") listingId: string,
    @Body() body: SyncPlatformExpiryDto,
  ) {
    return this.service.syncPlatformExpiry(userId, listingId, body);
  }

  @Post(":userId/portal/:listingId")
  createPortalForUser(
    @Param("userId") userId: string,
    @Param("listingId") listingId: string,
    @Body() body: { days: number },
  ) {
    return this.service.schedulePortal(userId, listingId, body.days ?? 60);
  }

  @Post(":userId/tenancy/:listingId")
  createTenancyForUser(
    @Param("userId") userId: string,
    @Param("listingId") listingId: string,
    @Body() body: { tenancyEnd: string },
  ) {
    return this.service.scheduleTenancy(userId, listingId, new Date(body.tenancyEnd));
  }

  @Post("portal/:listingId")
  createPortal(
    @Param("listingId") listingId: string,
    @Body() body: { userId: string; days: number },
  ) {
    return this.service.schedulePortal(body.userId, listingId, body.days ?? 60);
  }

  @Post("tenancy/:listingId")
  createTenancy(
    @Param("listingId") listingId: string,
    @Body() body: { userId: string; tenancyEnd: string },
  ) {
    return this.service.scheduleTenancy(body.userId, listingId, new Date(body.tenancyEnd));
  }
}
