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
import { timestampColumnType } from "../../database/column-types";
import { ListingEntity } from "../../listings/entities/listing.entity";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";

@Entity({ name: "leads" })
@Index("idx_leads_user_id", ["userId"])
@Index("idx_leads_user_status", ["userId", "status"])
export class LeadEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 255 })
  userId!: string;

  @Column({ name: "listing_id", type: "uuid", nullable: true })
  listingId!: string | null;

  @ManyToOne(() => ListingEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "listing_id" })
  listing?: ListingEntity;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 40, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email!: string | null;

  @Column({ type: "varchar", length: 64, default: "manual" })
  source!: string;

  @Column({ type: "varchar", length: 32, default: "NEW" })
  status!: LeadStatus;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({ name: "last_contacted_at", type: timestampColumnType as any, nullable: true })
  lastContactedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: timestampColumnType as any })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: timestampColumnType as any })
  updatedAt!: Date;
}
