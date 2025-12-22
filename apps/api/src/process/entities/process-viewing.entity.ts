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
import { ListingEntity } from "../../listings/entities/listing.entity";
import { ProcessLogEntity } from "./process-log.entity";
import { timestampColumnType } from "../../database/column-types";

@Entity({ name: "process_viewings" })
@Index("process_viewings_listing_idx", ["listingId"])
@Index("process_viewings_process_log_idx", ["processLogId"])
export class ProcessViewingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  processLogId!: string;

  @Column({ type: "uuid" })
  listingId!: string;

  @ManyToOne(() => ListingEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId" })
  listing?: ListingEntity;

  @ManyToOne(() => ProcessLogEntity, (processLog) => processLog.viewings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "processLogId" })
  processLog?: ProcessLogEntity;

  @Column({ type: "varchar", length: 160 })
  name!: string;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone?: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  email?: string | null;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ type: timestampColumnType as any, nullable: true })
  viewedAt?: Date | null;

  @Column({ type: "boolean", default: false })
  isSuccessfulBuyer!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
