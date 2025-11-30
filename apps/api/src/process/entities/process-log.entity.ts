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
import { ProcessStage } from "@leadlah/core";
import { ListingEntity } from "../../listings/entities/listing.entity";

@Entity({ name: "process_logs" })
@Index(["listingId", "stage"], { unique: true })
export class ProcessLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  listingId!: string;

  @ManyToOne(() => ListingEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listingId" })
  listing?: ListingEntity;

  @Column({ type: "varchar", length: 64 })
  stage!: ProcessStage;

  @Column({ type: "text", nullable: true })
  notes?: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  actor?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
