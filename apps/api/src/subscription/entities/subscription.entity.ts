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
import { jsonColumnType, timestampColumnType } from "../../database/column-types";
import { numericTransformer } from "../../database/numeric.transformer";

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

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: numericTransformer
  })
  planAmount!: number;

  @Column({ type: "varchar", length: 8, default: "MYR" })
  planCurrency!: string;

  @Column({ type: "varchar", length: 16, default: "monthly" })
  planInterval!: string;

  @Column({ type: timestampColumnType as any, nullable: true })
  trialEndsAt?: Date | null;

  @Column({ type: timestampColumnType as any, nullable: true })
  nextBillingAt?: Date | null;

  @Column({ type: timestampColumnType as any, nullable: true })
  graceEndsAt?: Date | null;

  @Column({ type: timestampColumnType as any, nullable: true })
  canceledAt?: Date | null;

  @Column({ type: jsonColumnType as any, nullable: true })
  metadata?: Record<string, unknown> | null;

  @OneToMany(() => SubscriptionInvoiceEntity, (invoice) => invoice.subscription)
  invoices?: SubscriptionInvoiceEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
