import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { SubscriptionEntity } from "./subscription.entity";
import { jsonColumnType, timestampColumnType } from "../../database/column-types";
import { numericTransformer } from "../../database/numeric.transformer";

@Entity({ name: "subscription_invoices" })
@Index("subscription_invoices_subscription_idx", ["subscriptionId"])
@Index("subscription_invoices_payment_idx", ["providerPaymentId"], { unique: true })
export class SubscriptionInvoiceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  subscriptionId!: string;

  @Column({ type: "varchar", length: 255 })
  userId!: string;

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.invoices, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "subscriptionId" })
  subscription?: SubscriptionEntity;

  @Column({ type: "varchar", length: 160, nullable: true })
  providerPaymentId?: string | null;

  @Column({ type: "varchar", length: 16, default: "Pending" })
  status!: string;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: numericTransformer
  })
  amount!: number;

  @Column({ type: "varchar", length: 8, default: "MYR" })
  currency!: string;

  @Column({ type: timestampColumnType as any, nullable: true })
  paidAt?: Date | null;

  @Column({ type: timestampColumnType as any, nullable: true })
  failedAt?: Date | null;

  @Column({ type: jsonColumnType as any, nullable: true })
  rawPayload?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
