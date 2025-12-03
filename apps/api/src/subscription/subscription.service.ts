import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  BillingInvoice,
  BillingInvoiceStatus,
  HitPayWebhook,
  SubscriptionState,
  SubscriptionStatus,
  SubscriptionSummary
} from "@leadlah/core";
import { Repository } from "typeorm";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { SubscriptionEntity } from "./entities/subscription.entity";
import { SubscriptionInvoiceEntity } from "./entities/subscription-invoice.entity";
import { loadSubscriptionConfig, SubscriptionConfig } from "./subscription.config";
import { HitpayClient } from "./hitpay.client";
import { CreateCheckoutDto } from "./dto/create-checkout.dto";

type InvoicePayloadOptions = {
  paymentId?: string;
  amount?: number;
  currency?: string;
  payload?: Record<string, unknown>;
  status: BillingInvoiceStatus;
};

@Injectable()
export class SubscriptionService {
  private readonly config: SubscriptionConfig;
  private readonly hitpay: HitpayClient;

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
    @InjectRepository(SubscriptionInvoiceEntity)
    private readonly invoiceRepository: Repository<SubscriptionInvoiceEntity>
  ) {
    this.config = loadSubscriptionConfig();
    this.hitpay = new HitpayClient({
      apiKey: this.config.hitpay.apiKey,
      baseUrl: this.config.hitpay.baseUrl
    });
  }

  async getSummary(userId: string): Promise<SubscriptionSummary> {
    const subscription = await this.getOrCreateSubscription(userId);
    const invoices = await this.invoiceRepository.find({
      where: { subscriptionId: subscription.id },
      order: { createdAt: "DESC" },
      take: 24
    });

    return {
      subscription: this.toState(subscription),
      invoices: invoices.map((invoice) => this.toInvoice(invoice)),
      plan: this.config.plan
    };
  }

  async startTrial(userId: string) {
    const subscription = await this.getOrCreateSubscription(userId);
    const now = new Date();
    subscription.status = SubscriptionStatus.TRIALING;
    subscription.graceEndsAt = null;
    subscription.canceledAt = null;
    subscription.nextBillingAt = this.config.plan.trialDays > 0 ? this.addDays(now, this.config.plan.trialDays) : now;
    subscription.trialEndsAt = subscription.nextBillingAt;
    const saved = await this.subscriptionRepository.save(subscription);
    return this.toState(saved);
  }

  async createCheckout(userId: string, payload: CreateCheckoutDto) {
    const subscription = await this.getOrCreateSubscription(userId);

    const response = await this.hitpay.createRecurringBilling({
      plan_id: null,
      save_card: "true",
      name: this.config.plan.name,
      amount: subscription.planAmount,
      currency: subscription.planCurrency,
      cycle: this.config.plan.interval,
      customer_email: payload.customerEmail,
      customer_name: payload.customerName,
      redirect_url: payload.redirectUrl ?? this.config.hitpay.defaultRedirectUrl,
      reference: subscription.providerReference,
      payment_methods: this.config.hitpay.paymentMethods,
      webhook: this.config.hitpay.webhookUrl,
      send_email: "true"
    });

    subscription.providerRecurringId = response.id;
    subscription.status = SubscriptionStatus.TRIALING;
    subscription.nextBillingAt = subscription.trialEndsAt ?? subscription.nextBillingAt;
    const updated = await this.subscriptionRepository.save(subscription);

    return {
      checkoutUrl: response.url,
      subscription: this.toState(updated)
    };
  }

  async retryCharge(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({ where: { userId } });
    if (!subscription) {
      throw new NotFoundException("No subscription found for this user.");
    }
    if (!subscription.providerRecurringId) {
      throw new BadRequestException("No saved payment method available. Please update the payment method.");
    }

    const result = await this.hitpay.chargeRecurringBilling(subscription.providerRecurringId, {
      amount: subscription.planAmount,
      currency: subscription.planCurrency
    });

    const normalizedStatus = (result.status ?? "").toLowerCase();
    const successful = normalizedStatus === "succeeded" || normalizedStatus === "paid";

    if (successful) {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.graceEndsAt = null;
      subscription.nextBillingAt = this.nextBillingDate();
      subscription.trialEndsAt = null;
    }

    await this.subscriptionRepository.save(subscription);
    await this.recordInvoice(subscription, {
      paymentId: result.payment_id,
      amount: Number(result.amount),
      currency: result.currency,
      status: successful ? "Paid" : "Failed",
      payload: result as unknown as Record<string, unknown>
    });

    return this.toState(subscription);
  }

  async cancelSubscription(userId: string) {
    const subscription = await this.subscriptionRepository.findOne({ where: { userId } });
    if (!subscription) {
      throw new NotFoundException("No subscription found for this user.");
    }

    if (subscription.providerRecurringId) {
      await this.hitpay.deleteRecurringBilling(subscription.providerRecurringId);
    }

    subscription.status = SubscriptionStatus.CANCELED;
    subscription.canceledAt = new Date();
    subscription.nextBillingAt = null;
    subscription.graceEndsAt = null;
    const saved = await this.subscriptionRepository.save(subscription);

    return this.toState(saved);
  }

  async handleWebhook(signature: string | undefined, payload: HitPayWebhook) {
    this.verifySignature(signature, payload);

    const subscription = await this.resolveSubscriptionFromPayload(payload);
    if (!subscription) {
      throw new NotFoundException("Subscription not found for the provided HitPay payload.");
    }

    await this.applyWebhook(subscription, payload);
    return { ok: true };
  }

  private async getOrCreateSubscription(userId: string): Promise<SubscriptionEntity> {
    let subscription = await this.subscriptionRepository.findOne({ where: { userId } });
    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        userId,
        providerReference: `sub_${randomUUID()}`,
        status: SubscriptionStatus.TRIALING,
        planAmount: this.config.plan.amount,
        planCurrency: this.config.plan.currency,
        planInterval: this.config.plan.interval,
        trialEndsAt:
          this.config.plan.trialDays > 0 ? this.addDays(new Date(), this.config.plan.trialDays) : undefined,
        nextBillingAt:
          this.config.plan.trialDays > 0 ? this.addDays(new Date(), this.config.plan.trialDays) : undefined
      });
      return this.subscriptionRepository.save(subscription);
    }

    let needsSync = false;
    if (subscription.planAmount !== this.config.plan.amount) {
      subscription.planAmount = this.config.plan.amount;
      needsSync = true;
    }
    if (subscription.planCurrency !== this.config.plan.currency) {
      subscription.planCurrency = this.config.plan.currency;
      needsSync = true;
    }
    if (subscription.planInterval !== this.config.plan.interval) {
      subscription.planInterval = this.config.plan.interval;
      needsSync = true;
    }

    return needsSync ? this.subscriptionRepository.save(subscription) : subscription;
  }

  private toState(entity: SubscriptionEntity): SubscriptionState {
    return {
      id: entity.id,
      status: entity.status,
      trialEndsAt: entity.trialEndsAt ?? undefined,
      nextBillingAt: entity.nextBillingAt ?? undefined,
      graceEndsAt: entity.graceEndsAt ?? undefined,
      canceledAt: entity.canceledAt ?? undefined,
      providerReference: entity.providerReference,
      providerRecurringId: entity.providerRecurringId ?? undefined,
      planAmount: Number(entity.planAmount),
      planCurrency: entity.planCurrency,
      planInterval: entity.planInterval
    };
  }

  private toInvoice(entity: SubscriptionInvoiceEntity): BillingInvoice {
    return {
      id: entity.id,
      subscriptionId: entity.subscriptionId,
      userId: entity.userId,
      amount: Number(entity.amount),
      currency: entity.currency,
      status: entity.status as BillingInvoiceStatus,
      paidAt: entity.paidAt ?? undefined,
      failedAt: entity.failedAt ?? undefined,
      providerPaymentId: entity.providerPaymentId ?? undefined,
      rawPayload: entity.rawPayload ?? undefined,
      createdAt: entity.createdAt
    };
  }

  private async resolveSubscriptionFromPayload(payload: HitPayWebhook): Promise<SubscriptionEntity | null> {
    const reference = payload.data.reference;
    if (reference) {
      const subscription = await this.subscriptionRepository.findOne({ where: { providerReference: reference } });
      if (subscription) {
        return subscription;
      }
    }

    const recurringId = payload.data.recurring_billing_id ?? payload.data.subscription_id;
    if (recurringId) {
      const subscription = await this.subscriptionRepository.findOne({
        where: { providerRecurringId: recurringId }
      });
      if (subscription) {
        return subscription;
      }
    }

    return null;
  }

  private async applyWebhook(subscription: SubscriptionEntity, payload: HitPayWebhook) {
    const event = (payload.event ?? "").toLowerCase();
    const status = (payload.data.status ?? "").toLowerCase();

    if (event === "payment.succeeded" || status === "succeeded" || status === "paid") {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.trialEndsAt = null;
      subscription.graceEndsAt = null;
      subscription.nextBillingAt = this.nextBillingDate();

      await this.subscriptionRepository.save(subscription);
      await this.recordInvoice(subscription, {
        paymentId: payload.data.payment_id ?? payload.data.id,
        amount: this.toAmount(payload.data.amount),
        currency: this.toCurrency(payload.data.currency),
        payload: payload.data,
        status: "Paid"
      });
      return;
    }

    if (event === "payment.failed" || status === "failed") {
      subscription.status = SubscriptionStatus.PAST_DUE;
      subscription.graceEndsAt =
        this.config.plan.graceDays > 0 ? this.addDays(new Date(), this.config.plan.graceDays) : null;
      await this.subscriptionRepository.save(subscription);
      await this.recordInvoice(subscription, {
        paymentId: payload.data.payment_id ?? payload.data.id,
        amount: this.toAmount(payload.data.amount),
        currency: this.toCurrency(payload.data.currency),
        payload: payload.data,
        status: "Failed"
      });
      return;
    }

    if (event === "subscription.canceled" || event === "recurring-billing.canceled") {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
      subscription.nextBillingAt = null;
      subscription.graceEndsAt = null;
      await this.subscriptionRepository.save(subscription);
    }
  }

  private async recordInvoice(subscription: SubscriptionEntity, options: InvoicePayloadOptions) {
    const amount = options.amount ?? subscription.planAmount;
    const currency = options.currency ?? subscription.planCurrency;
    const paymentId = options.paymentId ?? undefined;

    let invoice: SubscriptionInvoiceEntity | null = null;
    if (paymentId) {
      invoice = await this.invoiceRepository.findOne({ where: { providerPaymentId: paymentId } });
    }

    if (!invoice) {
      invoice = this.invoiceRepository.create({
        subscriptionId: subscription.id,
        userId: subscription.userId,
        providerPaymentId: paymentId ?? null,
        amount,
        currency,
        status: options.status
      });
    } else {
      invoice.amount = amount;
      invoice.currency = currency;
      invoice.status = options.status;
    }

    invoice.rawPayload = options.payload ?? invoice.rawPayload ?? null;
    invoice.paidAt = options.status === "Paid" ? new Date() : invoice.paidAt ?? null;
    invoice.failedAt = options.status === "Failed" ? new Date() : invoice.failedAt ?? null;

    await this.invoiceRepository.save(invoice);
  }

  private verifySignature(signature: string | undefined, payload: HitPayWebhook) {
    if (!this.config.hitpay.signatureKey) {
      return;
    }
    if (!signature) {
      throw new BadRequestException("Missing HitPay signature.");
    }

    const digest = createHmac("sha256", this.config.hitpay.signatureKey)
      .update(JSON.stringify(payload))
      .digest("hex");

    const left = Buffer.from(signature, "utf8");
    const right = Buffer.from(digest, "utf8");

    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      throw new BadRequestException("Invalid HitPay signature.");
    }
  }

  private toAmount(value: unknown): number {
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : this.config.plan.amount;
    }
    return this.config.plan.amount;
  }

  private toCurrency(value: unknown): string {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.toUpperCase();
    }
    return this.config.plan.currency;
  }

  private nextBillingDate() {
    const date = new Date();
    if (this.config.plan.interval === "yearly") {
      date.setFullYear(date.getFullYear() + 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    return date;
  }

  private addDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
