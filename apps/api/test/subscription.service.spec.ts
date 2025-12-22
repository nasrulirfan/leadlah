import { describe, beforeEach, expect, it, vi, afterEach } from "vitest";
import { SubscriptionService } from "../src/subscription/subscription.service";
import { SubscriptionStatus, type HitPayWebhook } from "@leadlah/core";
import type { Repository } from "typeorm";
import type { SubscriptionEntity } from "../src/subscription/entities/subscription.entity";
import type { SubscriptionInvoiceEntity } from "../src/subscription/entities/subscription-invoice.entity";

type RepoMock<T> = Partial<Record<keyof Repository<T>, ReturnType<typeof vi.fn>>>;

describe("SubscriptionService", () => {
  let service: SubscriptionService;
  let subscriptionRepository: RepoMock<SubscriptionEntity>;
  let invoiceRepository: RepoMock<SubscriptionInvoiceEntity>;

  beforeEach(() => {
    subscriptionRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
    };
    invoiceRepository = {
      findOne: vi.fn(),
      create: vi.fn((payload: any) => ({ id: "inv-1", createdAt: new Date(), ...payload })),
      save: vi.fn(),
      find: vi.fn(),
    };

    service = new SubscriptionService(
      subscriptionRepository as unknown as Repository<SubscriptionEntity>,
      invoiceRepository as unknown as Repository<SubscriptionInvoiceEntity>,
    );

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("activates subscription on successful payment webhook", async () => {
    const subscription = {
      id: "sub-1",
      userId: "user-1",
      providerReference: "ref-1",
      providerRecurringId: null,
      status: SubscriptionStatus.TRIALING,
      planAmount: 129,
      planCurrency: "MYR",
      planInterval: "monthly",
      trialEndsAt: new Date("2025-01-20T00:00:00Z"),
      nextBillingAt: new Date("2025-01-20T00:00:00Z"),
      graceEndsAt: null,
      canceledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    subscriptionRepository.findOne!.mockResolvedValue(subscription);
    subscriptionRepository.save!.mockResolvedValue(subscription);
    invoiceRepository.findOne!.mockResolvedValue(null);
    invoiceRepository.save!.mockResolvedValue(null);

    const payload: HitPayWebhook = {
      userId: "user-1",
      event: "payment.succeeded",
      data: {
        reference: "ref-1",
        amount: 100,
        currency: "SGD",
        payment_id: "pay-1",
      } as any,
    };

    const result = await service.handleWebhook(undefined, payload);
    expect(result).toEqual({ ok: true });

    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
    expect(subscription.trialEndsAt).toBeNull();
    expect(subscription.nextBillingAt?.toISOString()).toBe("2025-02-15T00:00:00.000Z");
    expect(subscriptionRepository.save).toHaveBeenCalled();
    expect(invoiceRepository.save).toHaveBeenCalled();
  });

  it("marks subscription past due on failed payment webhook", async () => {
    const subscription = {
      id: "sub-1",
      userId: "user-1",
      providerReference: "ref-1",
      providerRecurringId: null,
      status: SubscriptionStatus.ACTIVE,
      planAmount: 129,
      planCurrency: "MYR",
      planInterval: "monthly",
      trialEndsAt: null,
      nextBillingAt: new Date("2025-02-15T00:00:00Z"),
      graceEndsAt: null,
      canceledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    subscriptionRepository.findOne!.mockResolvedValue(subscription);
    subscriptionRepository.save!.mockResolvedValue(subscription);
    invoiceRepository.findOne!.mockResolvedValue(null);
    invoiceRepository.save!.mockResolvedValue(null);

    const payload: HitPayWebhook = {
      userId: "user-1",
      event: "payment.failed",
      data: {
        reference: "ref-1",
        amount: 100,
        currency: "SGD",
        payment_id: "pay-1",
      } as any,
    };

    const result = await service.handleWebhook(undefined, payload);
    expect(result).toEqual({ ok: true });

    expect(subscription.status).toBe(SubscriptionStatus.PAST_DUE);
    expect(subscription.graceEndsAt?.toISOString()).toBe("2025-01-18T00:00:00.000Z");
    expect(subscriptionRepository.save).toHaveBeenCalled();
    expect(invoiceRepository.save).toHaveBeenCalled();
  });

  it("cancels subscription on cancellation webhook", async () => {
    const subscription = {
      id: "sub-1",
      userId: "user-1",
      providerReference: "ref-1",
      providerRecurringId: "rec-1",
      status: SubscriptionStatus.ACTIVE,
      planAmount: 129,
      planCurrency: "MYR",
      planInterval: "monthly",
      trialEndsAt: null,
      nextBillingAt: new Date("2025-02-15T00:00:00Z"),
      graceEndsAt: null,
      canceledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    subscriptionRepository.findOne!.mockResolvedValue(subscription);
    subscriptionRepository.save!.mockResolvedValue(subscription);

    const payload: HitPayWebhook = {
      userId: "user-1",
      event: "subscription.canceled",
      data: {
        reference: "ref-1",
        subscription_id: "rec-1",
      } as any,
    };

    const result = await service.handleWebhook(undefined, payload);
    expect(result).toEqual({ ok: true });

    expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
    expect(subscription.canceledAt).toBeInstanceOf(Date);
    expect(subscription.nextBillingAt).toBeNull();
    expect(subscriptionRepository.save).toHaveBeenCalled();
  });
});

