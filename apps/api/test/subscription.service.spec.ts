import { describe, beforeEach, expect, it, vi, afterEach } from "vitest";
import { SubscriptionService } from "../src/subscription/subscription.service";
import { HitPayWebhook, SubscriptionStatus } from "@leadlah/core";

describe("SubscriptionService", () => {
  let service: SubscriptionService;
  const userId = "user-1";

  beforeEach(() => {
    service = new SubscriptionService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("activates subscription on successful payment", () => {
    const result = service.handleWebhook(userId, {
      event: "payment.succeeded",
      data: { invoiceId: "inv", amount: 100, currency: "SGD" }
    } satisfies HitPayWebhook);

    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(result.nextBillingAt?.toISOString()).toBe("2025-02-15T00:00:00.000Z");
  });

  it("marks subscription past due on failed payment", () => {
    const result = service.handleWebhook(userId, {
      event: "payment.failed",
      data: { invoiceId: "inv", amount: 100, currency: "SGD" }
    });

    expect(result.status).toBe(SubscriptionStatus.PAST_DUE);
    expect(result.graceEndsAt?.toISOString()).toBe("2025-01-18T00:00:00.000Z");
  });

  it("cancels subscription when webhook indicates cancellation", () => {
    const result = service.handleWebhook(userId, {
      event: "subscription.canceled",
      data: { subscriptionId: "sub" }
    });

    expect(result.status).toBe(SubscriptionStatus.CANCELED);
  });

  it("returns current state when webhook is unknown", () => {
    const current = service.handleWebhook(userId, {
      event: "payment.succeeded",
      data: { invoiceId: "inv", amount: 100, currency: "SGD" }
    });

    const unchanged = service.handleWebhook(userId, {
      event: "payment.failed-unknown" as any,
      data: { invoiceId: "inv", amount: 100, currency: "SGD" }
    });

    expect(unchanged).toEqual(current);
  });
});
