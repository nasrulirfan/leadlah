import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RemindersService } from "./reminders.service";
import { ReminderType } from "@leadlah/core";

@Controller("reminders")
export class RemindersController {
  constructor(private readonly service: RemindersService) {}

  @Get()
  list(@Query("type") type?: ReminderType) {
    return this.service.list(type);
  }

  @Post("portal/:listingId")
  createPortal(@Param("listingId") listingId: string, @Body() body: { days: number }) {
    return this.service.schedulePortal(listingId, body.days ?? 60);
  }

  @Post("tenancy/:listingId")
  createTenancy(@Param("listingId") listingId: string, @Body() body: { tenancyEnd: string }) {
    return this.service.scheduleTenancy(listingId, new Date(body.tenancyEnd));
  }
}
