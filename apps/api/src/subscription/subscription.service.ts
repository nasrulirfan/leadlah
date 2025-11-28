import { Injectable } from "@nestjs/common";
import { HitPayWebhook, SubscriptionStatus } from "@leadlah/core";

type SubscriptionState = {
  userId: string;
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  nextBillingAt?: Date;
  graceEndsAt?: Date;
};

@Injectable()
export class SubscriptionService {
  private subscriptions: Record<string, SubscriptionState> = {};

  upsert(userId: string, state: Partial<SubscriptionState>) {
    const existing = this.subscriptions[userId] ?? {
      userId,
      status: SubscriptionStatus.TRIALING
    };
    const updated: SubscriptionState = { ...existing, ...state };
    this.subscriptions[userId] = updated;
    return updated;
  }

  handleWebhook(userId: string, event: HitPayWebhook) {
    const current = this.subscriptions[userId] ?? {
      userId,
      status: SubscriptionStatus.TRIALING
    };

    if (event.event === "payment.succeeded") {
      return this.upsert(userId, {
        status: SubscriptionStatus.ACTIVE,
        nextBillingAt: this.nextMonth()
      });
    }

    if (event.event === "payment.failed") {
      return this.upsert(userId, {
        status: SubscriptionStatus.PAST_DUE,
        graceEndsAt: this.addDays(3)
      });
    }

    if (event.event === "subscription.canceled") {
      return this.upsert(userId, { status: SubscriptionStatus.CANCELED });
    }

    return current;
  }

  private addDays(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  private nextMonth() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  }
}
