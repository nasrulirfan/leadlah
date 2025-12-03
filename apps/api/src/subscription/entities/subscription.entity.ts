import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { SubscriptionStatus } from "@leadlah/core";
import { SubscriptionInvoiceEntity } from "./subscription-invoice.entity";

@Entity({ name: "subscriptions" })
@Index("subscriptions_user_idx", ["userId"], { unique: true })
@Index("subscriptions_provider_ref_idx", ["providerReference"], { unique: true })
@Index("subscriptions_provider_recurring_idx", ["providerRecurringId"], { unique: true })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  userId!: string;

  @Column({ type: "varchar", length: 120 })
  providerReference!: string;

  @Column({ type: "varchar", length: 160, nullable: true })
  providerRecurringId?: string | null;

  @Column({ type: "varchar", length: 24, default: SubscriptionStatus.TRIALING })
  status!: SubscriptionStatus;

  @Column({ type: "numeric", precision: 10, scale: 2, default: 0 })
  planAmount!: number;

  @Column({ type: "varchar", length: 8, default: "MYR" })
  planCurrency!: string;

  @Column({ type: "varchar", length: 16, default: "monthly" })
  planInterval!: string;

  @Column({ type: "timestamptz", nullable: true })
  trialEndsAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  nextBillingAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  graceEndsAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  canceledAt?: Date | null;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown> | null;

  @OneToMany(() => SubscriptionInvoiceEntity, (invoice) => invoice.subscription)
  invoices?: SubscriptionInvoiceEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
