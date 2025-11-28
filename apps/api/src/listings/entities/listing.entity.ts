import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ListingStatus } from "@leadlah/core";

@Entity({ name: "listings" })
export class ListingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  propertyName!: string;

  @Column()
  type!: string;

  @Column("decimal")
  price!: number;

  @Column("decimal")
  size!: number;

  @Column("int")
  bedrooms!: number;

  @Column("int")
  bathrooms!: number;

  @Column()
  location!: string;

  @Column({ type: "enum", enum: ListingStatus, default: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @Column({ type: "jsonb", default: [] })
  photos!: Record<string, string>[];

  @Column({ type: "jsonb", default: [] })
  videos!: Record<string, string>[];

  @Column({ type: "jsonb", default: [] })
  documents!: Record<string, string>[];

  @Column({ type: "jsonb", default: [] })
  externalLinks!: Record<string, string>[];

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}
