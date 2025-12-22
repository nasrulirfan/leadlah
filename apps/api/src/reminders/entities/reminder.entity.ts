import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { jsonColumnType, timestampColumnType } from "../../database/column-types";
import { ListingEntity } from "../../listings/entities/listing.entity";

export type ReminderStatus = "PENDING" | "DONE" | "DISMISSED";
export type ReminderRecurrence = "NONE" | "WEEKLY" | "MONTHLY";

@Entity({ name: "reminders" })
@Index("reminders_user_due_idx", ["userId", "status", "dueAt"])
@Index("reminders_listing_idx", ["listingId"])
export class ReminderEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  userId!: string;

  @Column({ type: "uuid", nullable: true })
  listingId!: string | null;

  @ManyToOne(() => ListingEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId" })
  listing?: ListingEntity;

  @Column({ type: "varchar", length: 64 })
  type!: string;

  @Column({ type: timestampColumnType as any })
  dueAt!: Date;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 16, default: "PENDING" })
  status!: ReminderStatus;

  @Column({ type: "varchar", length: 16, default: "NONE" })
  recurrence!: ReminderRecurrence;

  @Column({ type: "int", default: 1 })
  recurrenceInterval!: number;

  @Column({ type: jsonColumnType as any, nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: timestampColumnType as any, nullable: true })
  completedAt!: Date | null;

  @Column({ type: timestampColumnType as any, nullable: true })
  dismissedAt!: Date | null;

  @CreateDateColumn({ type: timestampColumnType as any })
  createdAt!: Date;

  @UpdateDateColumn({ type: timestampColumnType as any })
  updatedAt!: Date;
}
