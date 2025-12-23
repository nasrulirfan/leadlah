import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ExternalLink, ListingCategory, ListingStatus, MediaAsset } from "@leadlah/core";
import { numericTransformer } from "../../database/numeric.transformer";

const timestampColumnType = process.env.NODE_ENV === "test" ? "datetime" : "timestamptz";

@Entity({ name: "listings" })
export class ListingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  propertyName!: string;

  @Column({ type: "varchar", length: 100 })
  type!: string;

  @Column({ type: "varchar", length: 32, default: ListingCategory.FOR_SALE })
  category!: ListingCategory;

  @Column({
    type: "numeric",
    precision: 15,
    scale: 2,
    transformer: numericTransformer,
  })
  price!: number;

  @Column({
    type: "numeric",
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  size!: number;

  @Column({ type: "int" })
  bedrooms!: number;

  @Column({ type: "int" })
  bathrooms!: number;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  buildingProject!: string | null;

  @Column({ type: "varchar", length: 32, default: ListingStatus.ACTIVE })
  status!: ListingStatus;

  @Column({ type: timestampColumnType as any, nullable: true })
  expiresAt?: Date;

  @Column({ type: timestampColumnType as any, nullable: true })
  lastEnquiryAt?: Date;

  @Column({ type: "simple-json", default: "[]" })
  photos!: MediaAsset[];

  @Column({ type: "simple-json", default: "[]" })
  videos!: MediaAsset[];

  @Column({ type: "simple-json", default: "[]" })
  documents!: MediaAsset[];

  @Column({ type: "simple-json", default: "[]" })
  externalLinks!: ExternalLink[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
