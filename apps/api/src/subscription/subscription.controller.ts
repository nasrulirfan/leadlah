import { Body, Controller, Post } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { HitPayWebhook } from "@leadlah/core";

@Controller("billing")
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Post("webhook/hitpay")
  webhook(@Body() body: HitPayWebhook & { userId: string }) {
    return this.service.handleWebhook(body.userId, body);
  }
}
