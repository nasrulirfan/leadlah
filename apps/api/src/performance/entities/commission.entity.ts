import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ListingEntity } from "../../listings/entities/listing.entity";
import { numericTransformer } from "../../database/numeric.transformer";
import { timestampColumnType } from "../../database/column-types";

@Entity({ name: "commissions" })
@Index("idx_commissions_user_id", ["userId"])
export class CommissionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 255 })
  userId!: string;

  @Column({ name: "listing_id", type: "uuid", nullable: true })
  listingId!: string | null;

  @ManyToOne(() => ListingEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "listing_id" })
  listing?: ListingEntity;

  @Column({
    type: "numeric",
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  amount!: number;

  @Column({ name: "closed_date", type: "date" })
  closedDate!: Date;

  @Column({ type: "text", nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: "created_at", type: timestampColumnType as any })
  createdAt!: Date;
}
