type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

export type CreateRecurringBillingPayload = {
  plan_id?: string | null;
  save_card?: string;
  name: string;
  amount: number;
  currency: string;
  cycle: "weekly" | "monthly" | "yearly" | "custom";
  cycle_repeat?: number | null;
  cycle_frequency?: "day" | "week" | "month" | "year" | null;
  customer_email: string;
  customer_name: string;
  redirect_url?: string;
  reference?: string;
  payment_methods?: string[];
  webhook?: string;
  send_email?: string;
};

export type ChargeRecurringBillingPayload = {
  amount: number;
  currency: string;
};

export type RecurringBillingResponse = {
  id: string;
  url: string;
  status: string;
  amount: number;
  currency: string;
  recurring_billing_id?: string;
  reference?: string;
};

export type ChargeResponse = {
  payment_id: string;
  recurring_billing_id: string;
  amount: number;
  currency: string;
  status: string;
};

export class HitpayClient {
  constructor(
    private readonly config: {
      apiKey: string;
      baseUrl: string;
    }
  ) {}

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-BUSINESS-API-KEY": this.config.apiKey,
        ...options.headers
      }
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `HitPay request failed (${response.status}): ${text || response.statusText || "Unknown error"}`
      );
    }

    return text ? (JSON.parse(text) as T) : ({} as T);
  }

  createRecurringBilling(payload: CreateRecurringBillingPayload) {
    return this.request<RecurringBillingResponse>("/recurring-billing", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  deleteRecurringBilling(id: string) {
    return this.request(`/recurring-billing/${id}`, {
      method: "DELETE"
    });
  }

  chargeRecurringBilling(id: string, payload: ChargeRecurringBillingPayload) {
    return this.request<ChargeResponse>(`/charge/recurring-billing/${id}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
}
