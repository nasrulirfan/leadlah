import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { ExpenseCategory } from "@leadlah/core";
import { numericTransformer } from "../../database/numeric.transformer";
import { timestampColumnType } from "../../database/column-types";

@Entity({ name: "expenses" })
@Index("idx_expenses_user_id", ["userId"])
export class ExpenseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 255 })
  userId!: string;

  @Column({ type: "varchar", length: 50 })
  category!: ExpenseCategory;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    transformer: numericTransformer,
  })
  amount!: number;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "date" })
  date!: Date;

  @Column({ name: "receipt_url", type: "text", nullable: true })
  receiptUrl!: string | null;

  @CreateDateColumn({ name: "created_at", type: timestampColumnType as any })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: timestampColumnType as any })
  updatedAt!: Date;
}

