import { describe, beforeEach, expect, it, vi } from "vitest";
import { SubscriptionController } from "../src/subscription/subscription.controller";
import { SubscriptionService } from "../src/subscription/subscription.service";

describe("SubscriptionController", () => {
  let controller: SubscriptionController;
  let service: SubscriptionService;

  beforeEach(() => {
    service = {
      handleWebhook: vi.fn()
    } as unknown as SubscriptionService;

    controller = new SubscriptionController(service);
  });

  it("forwards webhook payloads to the service", () => {
    const payload = {
      userId: "user",
      event: "payment.succeeded",
      data: { invoiceId: "inv", amount: 100, currency: "SGD" }
    } as any;
    vi.spyOn(service, "handleWebhook").mockReturnValue({ status: "ok" } as any);

    expect(controller.webhook(undefined, payload)).toEqual({ status: "ok" });
    expect(service.handleWebhook).toHaveBeenCalledWith(undefined, payload);
  });
});
