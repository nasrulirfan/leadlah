import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { numericTransformer } from "../../database/numeric.transformer";
import { timestampColumnType } from "../../database/column-types";

@Entity({ name: "targets" })
@Index("unique_user_period", ["userId", "year", "month"], { unique: true })
export class TargetEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", type: "varchar", length: 255 })
  userId!: string;

  @Column({ type: "int" })
  year!: number;

  @Column({ type: "int", nullable: true })
  month!: number | null;

  @Column({ name: "target_units", type: "int", default: 0 })
  targetUnits!: number;

  @Column({
    name: "target_income",
    type: "numeric",
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  targetCommission!: number;

  @CreateDateColumn({ name: "created_at", type: timestampColumnType as any })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: timestampColumnType as any })
  updatedAt!: Date;
}
