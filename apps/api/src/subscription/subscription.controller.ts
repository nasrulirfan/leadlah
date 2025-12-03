import { Body, Controller, Get, Headers, Param, Post } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { HitPayWebhook } from "@leadlah/core";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

@Controller("billing")
export class SubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  @Get(":userId")
  summary(@Param("userId") userId: string) {
    return this.service.getSummary(userId);
  }

  @Post(":userId/trial")
  startTrial(@Param("userId") userId: string) {
    return this.service.startTrial(userId);
  }

  @Post(":userId/checkout")
  checkout(@Param("userId") userId: string, @Body() body: CreateCheckoutDto) {
    return this.service.createCheckout(userId, body);
  }

  @Post(":userId/retry")
  retry(@Param("userId") userId: string) {
    return this.service.retryCharge(userId);
  }

  @Post(":userId/cancel")
  cancel(@Param("userId") userId: string) {
    return this.service.cancelSubscription(userId);
  }

  @Post("webhook/hitpay")
  webhook(@Headers("hitpay-signature") signature: string | undefined, @Body() body: HitPayWebhook) {
    return this.service.handleWebhook(signature, body);
  }
}
