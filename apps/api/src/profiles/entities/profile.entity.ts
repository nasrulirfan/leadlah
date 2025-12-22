import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { jsonColumnType, timestampColumnType } from "../../database/column-types";

export type NotificationPreferences = {
  reminders: boolean;
  smartDigest: boolean;
  productUpdates: boolean;
};

@Entity({ name: "profiles" })
export class ProfileEntity {
  @PrimaryColumn({ type: "varchar", length: 255 })
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  email!: string;

  @Column({ type: "varchar", length: 40, nullable: true })
  phone!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  agency!: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  role!: string | null;

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({ type: "text", nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "text", nullable: true })
  coverUrl!: string | null;

  @Column({ type: "varchar", length: 64 })
  timezone!: string;

  @Column({ type: "varchar", length: 64 })
  language!: string;

  @Column({ type: "varchar", length: 40, nullable: true })
  whatsapp!: string | null;

  @Column({
    type: jsonColumnType as any,
    default: '{"reminders":true,"smartDigest":true,"productUpdates":false}',
  })
  notifications!: NotificationPreferences;

  @CreateDateColumn({ type: timestampColumnType as any })
  createdAt!: Date;

  @UpdateDateColumn({ type: timestampColumnType as any })
  updatedAt!: Date;
}
