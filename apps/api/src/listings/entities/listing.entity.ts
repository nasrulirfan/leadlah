import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ExternalLink, ListingStatus, MediaAsset } from "@leadlah/core";

@Entity({ name: "listings" })
export class ListingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  propertyName!: string;

  @Column({ type: "varchar", length: 100 })
  type!: string;

  @Column({ type: "numeric", precision: 15, scale: 2 })
  price!: number;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  size!: number;

  @Column({ type: "int" })
  bedrooms!: number;

  @Column({ type: "int" })
  bathrooms!: number;

  @Column({ type: "varchar", length: 255 })
  location!: string;

  @Column({ type: "varchar", length: 32, default: ListingStatus.ACTIVE })
  status!: ListingStatus;

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
