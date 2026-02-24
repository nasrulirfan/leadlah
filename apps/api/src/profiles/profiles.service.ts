import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { UserProfile } from "@leadlah/core";
import { Repository } from "typeorm";
import { ProfileEntity } from "./entities/profile.entity";
import { UpsertProfileDto } from "./dto/upsert-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

const toProfile = (entity: ProfileEntity): UserProfile => ({
  id: entity.id,
  name: entity.name,
  email: entity.email,
  phone: entity.phone ?? undefined,
  agency: entity.agency ?? undefined,
  renNumber: entity.renNumber ?? undefined,
  agencyLogoUrl: entity.agencyLogoUrl ?? undefined,
  role: entity.role ?? undefined,
  bio: entity.bio ?? undefined,
  avatarUrl: entity.avatarUrl ?? undefined,
  coverUrl: entity.coverUrl ?? undefined,
  timezone: entity.timezone,
  language: entity.language,
  whatsapp: entity.whatsapp ?? undefined,
  notifications: {
    reminders: Boolean(entity.notifications?.reminders),
    smartDigest: Boolean(entity.notifications?.smartDigest),
    productUpdates: Boolean(entity.notifications?.productUpdates),
  },
});

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profiles: Repository<ProfileEntity>,
  ) {}

  async get(userId: string): Promise<UserProfile> {
    const entity = await this.profiles.findOne({ where: { id: userId } });
    if (!entity) {
      throw new NotFoundException("Profile not found");
    }
    return toProfile(entity);
  }

  async upsert(
    userId: string,
    payload: UpsertProfileDto,
  ): Promise<UserProfile> {
    const current = await this.profiles.findOne({ where: { id: userId } });
    const notifications = {
      reminders:
        payload.notifications?.reminders ??
        current?.notifications?.reminders ??
        true,
      smartDigest:
        payload.notifications?.smartDigest ??
        current?.notifications?.smartDigest ??
        true,
      productUpdates:
        payload.notifications?.productUpdates ??
        current?.notifications?.productUpdates ??
        false,
    };

    const entity = this.profiles.create({
      ...(current ?? { id: userId }),
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      agency: payload.agency,
      renNumber: payload.renNumber ?? current?.renNumber ?? null,
      agencyLogoUrl: payload.agencyLogoUrl ?? current?.agencyLogoUrl ?? null,
      role: payload.role ?? null,
      bio: payload.bio ?? null,
      avatarUrl: payload.avatarUrl ?? null,
      coverUrl: payload.coverUrl ?? null,
      timezone: payload.timezone,
      language: payload.language,
      whatsapp: payload.whatsapp ?? null,
      notifications,
    });

    const saved = await this.profiles.save(entity);
    return toProfile(saved);
  }

  async update(
    userId: string,
    payload: UpdateProfileDto,
  ): Promise<UserProfile> {
    const entity = await this.profiles.findOne({ where: { id: userId } });
    if (!entity) {
      throw new NotFoundException("Profile not found");
    }

    if (payload.name != null) {
      entity.name = payload.name;
    }
    if (payload.email != null) {
      entity.email = payload.email;
    }
    if (payload.phone !== undefined) {
      entity.phone = payload.phone;
    }
    if (payload.agency !== undefined) {
      entity.agency = payload.agency;
    }
    if (payload.renNumber !== undefined) {
      entity.renNumber = payload.renNumber ?? null;
    }
    if (payload.agencyLogoUrl !== undefined) {
      entity.agencyLogoUrl = payload.agencyLogoUrl ?? null;
    }
    if (payload.role !== undefined) {
      entity.role = payload.role ?? null;
    }
    if (payload.bio !== undefined) {
      entity.bio = payload.bio ?? null;
    }
    if (payload.avatarUrl !== undefined) {
      entity.avatarUrl = payload.avatarUrl ?? null;
    }
    if (payload.coverUrl !== undefined) {
      entity.coverUrl = payload.coverUrl ?? null;
    }
    if (payload.timezone != null) {
      entity.timezone = payload.timezone;
    }
    if (payload.language != null) {
      entity.language = payload.language;
    }
    if (payload.whatsapp !== undefined) {
      entity.whatsapp = payload.whatsapp ?? null;
    }

    if (payload.notifications) {
      entity.notifications = {
        reminders:
          payload.notifications.reminders ?? entity.notifications.reminders,
        smartDigest:
          payload.notifications.smartDigest ?? entity.notifications.smartDigest,
        productUpdates:
          payload.notifications.productUpdates ??
          entity.notifications.productUpdates,
      };
    }

    const saved = await this.profiles.save(entity);
    return toProfile(saved);
  }
}
