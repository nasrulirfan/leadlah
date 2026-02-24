import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { Pool } from "pg";
import { DataSource, In, IsNull } from "typeorm";
import {
  ExpenseCategory,
  ListingCategory,
  ListingStatus,
  ListingTenure,
  ProcessStage,
  SubscriptionStatus,
  generateOwnerViewToken
} from "@leadlah/core";
import { ListingEntity } from "../listings/entities/listing.entity";
import { ProcessLogEntity } from "../process/entities/process-log.entity";
import { ProcessViewingEntity } from "../process/entities/process-viewing.entity";
import { ReminderEntity } from "../reminders/entities/reminder.entity";
import { ProfileEntity } from "../profiles/entities/profile.entity";
import { TargetEntity } from "../performance/entities/target.entity";
import { ExpenseEntity } from "../performance/entities/expense.entity";
import { CommissionEntity } from "../performance/entities/commission.entity";
import { SubscriptionEntity } from "../subscription/entities/subscription.entity";
import { SubscriptionInvoiceEntity } from "../subscription/entities/subscription-invoice.entity";
import { LeadEntity } from "../leads/entities/lead.entity";
import { loadSubscriptionConfig } from "../subscription/subscription.config";

type SeedOptions = {
  createAuthUser: boolean;
  userId: string;
  email: string;
  password: string;
  name: string;
  reset: boolean;
  seed: string;
  force: boolean;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const encodeOwnerViewTokenForUrl = (token: { listingId: string; token: string; expiresAt: Date }) => {
  const payload = JSON.stringify({
    listingId: token.listingId,
    token: token.token,
    expiresAt: token.expiresAt.toISOString()
  });
  return Buffer.from(payload, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const loadEnvFiles = () => {
  const candidates = [
    path.resolve(__dirname, "../../../../.env"),
    path.resolve(__dirname, "../../../../.env.local"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../.env.local"),
    path.resolve(__dirname, "../../../web/.env"),
    path.resolve(__dirname, "../../../web/.env.local")
  ];
  for (const filePath of candidates) {
    loadEnv({ path: filePath, override: true });
  }
};

const parseArgValue = (args: string[], key: string) => {
  const idx = args.indexOf(key);
  if (idx === -1) {
    return null;
  }
  const value = args[idx + 1];
  if (!value || value.startsWith("--")) {
    return null;
  }
  return value;
};

const parseBooleanFlag = (args: string[], key: string) => args.includes(key);

const printHelp = () => {
  console.log(`
LeadLah demo seeder

Usage:
  pnpm --filter @leadlah/api db:seed -- [options]

Options:
  --createAuthUser  Create/fetch a Better-auth user and seed using its userId (default unless --userId is provided)
  --skipAuthUser    Skip Better-auth user creation (always seed using --userId)
  --userId <id>     User id to seed data for (default: demo-user)
  --email <email>   Auth + profile email (default: demo@leadlah.com)
  --password <pw>   Auth password (default: Demo12345!)
  --name <name>     Auth + profile name (default: Demo Agent)
  --seed <string>   Random seed string (default: demo)
  --reset           Truncate LeadLah tables before seeding
  --force           Allow running when NODE_ENV=production
  --help            Show this help
`.trim());
};

const parseOptions = (): SeedOptions => {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const userIdProvided = args.includes("--userId");

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const createAuthUserFlag = parseBooleanFlag(args, "--createAuthUser");
  const createAuthUser =
    !parseBooleanFlag(args, "--skipAuthUser") &&
    (createAuthUserFlag || !userIdProvided);

  if (userIdProvided && createAuthUserFlag) {
    console.warn("⚠️  Both --userId and --createAuthUser were provided; using the Better-auth user id.");
  }

  return {
    createAuthUser,
    userId: parseArgValue(args, "--userId") ?? "demo-user",
    email: parseArgValue(args, "--email") ?? "demo@leadlah.com",
    password: parseArgValue(args, "--password") ?? "Demo12345!",
    name: parseArgValue(args, "--name") ?? "Demo Agent",
    seed: parseArgValue(args, "--seed") ?? "demo",
    reset: parseBooleanFlag(args, "--reset"),
    force: parseBooleanFlag(args, "--force")
  };
};

const uuidFor = (...parts: Array<string | number | null | undefined>) => {
  const input = parts.filter((part) => part != null).join(":");
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 32).split("");
  hash[12] = "4";
  hash[16] = "a";
  const hex = hash.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const normalizeEmail = (value?: string | null) => {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized.length ? normalized : null;
};

const normalizePhone = (value?: string | null) => {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) {
    return null;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length >= 9) {
    return `60${digits.slice(1)}`;
  }

  return digits;
};

async function waitForDatabase(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const maxAttempts = 30;
  try {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await pool.query("SELECT 1");
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⏳ Waiting for database (${attempt}/${maxAttempts}): ${message}`);
        await wait(1000);
      }
    }
    throw new Error("Database did not become ready in time.");
  } finally {
    await pool.end();
  }
}

async function ensureBetterAuthUser(params: {
  email: string;
  password: string;
  name: string;
}): Promise<{ userId: string; existed: boolean }> {
  const databaseUrl = process.env.BETTER_AUTH_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("BETTER_AUTH_DATABASE_URL (or DATABASE_URL) must be set to seed a Better-auth user.");
  }

  const betterAuthEntry = path.resolve(
    __dirname,
    "../../../web/node_modules/better-auth/dist/index.mjs"
  );

  let betterAuth: any;
  try {
    const moduleUrl = pathToFileURL(betterAuthEntry).href;
    // ts-node runs this file in CommonJS mode; native `import()` gets downleveled to `require()`.
    // Use a runtime dynamic import to load Better-auth's ESM build.
    const dynamicImport = new Function(
      "moduleUrl",
      "return import(moduleUrl);"
    ) as (moduleUrl: string) => Promise<any>;
    const imported = (await dynamicImport(moduleUrl)) as any;
    betterAuth = imported.betterAuth;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to load Better-auth from ${betterAuthEntry}. Ensure @leadlah/web dependencies are installed (or run with --skipAuthUser). (${message})`
    );
  }

  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const auth = betterAuth({
      basePath: "/api/auth",
      baseURL:
        process.env.BETTER_AUTH_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        process.env.APP_URL ??
        "http://localhost:3000",
      secret: process.env.BETTER_AUTH_SECRET,
      database: pool,
      emailAndPassword: { enabled: true }
    });

    const ctx = auth.$context ? await auth.$context : null;
    if (ctx && typeof ctx.runMigrations === "function") {
      await ctx.runMigrations();
    }

    const existing =
      ctx?.internalAdapter && typeof ctx.internalAdapter.findUserByEmail === "function"
        ? await ctx.internalAdapter.findUserByEmail(params.email, { includeAccounts: true })
        : null;

    if (existing?.user?.id) {
      return { userId: String(existing.user.id), existed: true };
    }

    const created = await auth.api.signUpEmail({
      body: {
        name: params.name,
        email: params.email,
        password: params.password
      }
    });

    const createdUserId = created?.user?.id;
    if (!createdUserId) {
      throw new Error("Better-auth signUpEmail did not return a user id.");
    }

    return { userId: String(createdUserId), existed: false };
  } finally {
    await pool.end();
  }
}

async function seed(options: SeedOptions) {
  if (process.env.NODE_ENV === "production" && !options.force) {
    throw new Error("Refusing to run seeder with NODE_ENV=production (pass --force to override).");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set (read from apps/api/.env).");
  }

  await waitForDatabase(databaseUrl);

  const seedUserId = options.createAuthUser
    ? (await ensureBetterAuthUser({
        email: options.email,
        password: options.password,
        name: options.name
      })).userId
    : options.userId;

  const dataSource = new DataSource({
    type: "postgres",
    url: databaseUrl,
    entities: [
      ListingEntity,
      ProcessLogEntity,
      ProcessViewingEntity,
      ReminderEntity,
      ProfileEntity,
      TargetEntity,
      ExpenseEntity,
      CommissionEntity,
      SubscriptionEntity,
      SubscriptionInvoiceEntity,
      LeadEntity
    ]
  });

  await dataSource.initialize();

  const listingsRepo = dataSource.getRepository(ListingEntity);
  const processLogsRepo = dataSource.getRepository(ProcessLogEntity);
  const viewingsRepo = dataSource.getRepository(ProcessViewingEntity);
  const remindersRepo = dataSource.getRepository(ReminderEntity);
  const profilesRepo = dataSource.getRepository(ProfileEntity);
  const targetsRepo = dataSource.getRepository(TargetEntity);
  const expensesRepo = dataSource.getRepository(ExpenseEntity);
  const commissionsRepo = dataSource.getRepository(CommissionEntity);
  const subscriptionsRepo = dataSource.getRepository(SubscriptionEntity);
  const invoicesRepo = dataSource.getRepository(SubscriptionInvoiceEntity);
  const leadsRepo = dataSource.getRepository(LeadEntity);

  try {
    if (options.reset) {
      console.log("🧹 Resetting LeadLah tables...");
      await dataSource.query(
        [
          'TRUNCATE TABLE "process_viewings"',
          '"process_logs"',
          '"reminders"',
          '"subscription_invoices"',
          '"subscriptions"',
          '"commissions"',
          '"expenses"',
          '"targets"',
          '"leads"',
          '"profiles"',
          '"listings" CASCADE;'
        ].join(", ")
      );
    }

    const now = new Date();
    const seedKey = `${options.seed}:${seedUserId}`;

    console.log(`👤 Seeding for userId=${seedUserId}`);

    await profilesRepo.upsert(
      {
        id: seedUserId,
        name: options.name,
        email: options.email,
        phone: "+60 12-345 6789",
        agency: "LeadLah Realty",
        renNumber: "REN-12345",
        agencyLogoUrl: "https://placehold.co/320x96/png?text=LeadLah+Realty",
        role: "REN Agent",
        bio: "Demo account seeded for product walkthroughs.",
        avatarUrl: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe",
        coverUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
        timezone: "Asia/Kuala_Lumpur",
        language: "en",
        whatsapp: "+60 12-345 6789",
        notifications: { reminders: true, smartDigest: true, productUpdates: false }
      },
      ["id"]
    );

    const demoListings: ListingEntity[] = [
      listingsRepo.create({
        id: "8e4e1b32-2c4c-4e4f-9b5a-1fd3c1f1a001",
        propertyName: "Seri Maya Condo",
        lotUnitNo: "A-18-07",
        type: "Condominium",
        category: ListingCategory.FOR_SALE,
        tenure: ListingTenure.FREEHOLD,
        price: 950000,
        bankValue: 980000,
        competitorPriceRange: "900k - 1.05m",
        size: 1200,
        bedrooms: 3,
        bathrooms: 2,
        location: "Kuala Lumpur",
        buildingProject: "Seri Maya",
        status: ListingStatus.ACTIVE,
        expiresAt: addDays(now, 60),
        lastEnquiryAt: addDays(now, -4),
        photos: [
          {
            url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85",
            label: "Living"
          }
        ],
        videos: [],
        documents: [{ url: "https://example.com/title.pdf", label: "Title Deed" }],
        externalLinks: [
          {
            provider: "Mudah",
            url: "https://mudah.my/listing/seri-maya",
            expiresAt: addDays(now, 60)
          }
        ],
        createdAt: addDays(now, -10),
        updatedAt: now
      }),
      listingsRepo.create({
        id: "6a6c8d8e-c9ab-4de0-9b0a-20e40da7ab02",
        propertyName: "Damansara Heights Bungalow",
        lotUnitNo: null,
        type: "Landed",
        category: ListingCategory.FOR_RENT,
        tenure: ListingTenure.LEASEHOLD,
        price: 3200000,
        bankValue: 3000000,
        competitorPriceRange: "2.9m - 3.3m",
        size: 4800,
        bedrooms: 6,
        bathrooms: 6,
        location: "Damansara, Selangor",
        buildingProject: "Damansara Heights",
        status: ListingStatus.ACTIVE,
        expiresAt: addDays(now, 20),
        lastEnquiryAt: addDays(now, -12),
        photos: [
          {
            url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e",
            label: "Facade"
          }
        ],
        videos: [],
        documents: [],
        externalLinks: [
          {
            provider: "PropertyGuru",
            url: "https://propertyguru.com/listing/damansara",
            expiresAt: addDays(now, 20)
          }
        ],
        createdAt: addDays(now, -30),
        updatedAt: now
      }),
      listingsRepo.create({
        id: uuidFor(seedKey, "listing", "bangsar-south"),
        propertyName: "Bangsar South High-Rise",
        type: "Condominium",
        category: ListingCategory.SOLD,
        tenure: ListingTenure.FREEHOLD,
        price: 1120000,
        bankValue: 1090000,
        competitorPriceRange: "1.05m - 1.15m",
        size: 980,
        bedrooms: 3,
        bathrooms: 2,
        location: "Bangsar South, Kuala Lumpur",
        buildingProject: "South View Residence",
        status: ListingStatus.SOLD,
        expiresAt: addDays(now, -2),
        lastEnquiryAt: addDays(now, -28),
        photos: [
          { url: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2a2c", label: "Living" }
        ],
        videos: [],
        documents: [],
        externalLinks: [],
        createdAt: addDays(now, -75),
        updatedAt: addDays(now, -21)
      }),
      listingsRepo.create({
        id: uuidFor(seedKey, "listing", "setapak-rental"),
        propertyName: "Setapak Family Rental",
        type: "Apartment",
        category: ListingCategory.RENTED,
        tenure: ListingTenure.FREEHOLD,
        price: 2600,
        bankValue: null,
        competitorPriceRange: null,
        size: 900,
        bedrooms: 3,
        bathrooms: 2,
        location: "Setapak, Kuala Lumpur",
        buildingProject: "Setapak Central",
        status: ListingStatus.RENTED,
        lastEnquiryAt: addDays(now, -40),
        photos: [{ url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511", label: "Unit" }],
        videos: [],
        documents: [],
        externalLinks: [],
        createdAt: addDays(now, -120),
        updatedAt: addDays(now, -60)
      }),
      listingsRepo.create({
        id: uuidFor(seedKey, "listing", "expired-1"),
        propertyName: "Old Townhouse (Expired)",
        type: "Landed",
        category: ListingCategory.FOR_SALE,
        tenure: ListingTenure.LEASEHOLD,
        price: 780000,
        bankValue: 740000,
        competitorPriceRange: "720k - 820k",
        size: 1500,
        bedrooms: 4,
        bathrooms: 3,
        location: "Cheras, Kuala Lumpur",
        buildingProject: null,
        status: ListingStatus.EXPIRED,
        expiresAt: addDays(now, -8),
        lastEnquiryAt: addDays(now, -95),
        photos: [],
        videos: [],
        documents: [],
        externalLinks: [],
        createdAt: addDays(now, -180),
        updatedAt: addDays(now, -8)
      }),
      listingsRepo.create({
        id: uuidFor(seedKey, "listing", "withdrawn-1"),
        propertyName: "City Studio (Withdrawn)",
        type: "Studio",
        category: ListingCategory.OFF_MARKET,
        tenure: ListingTenure.FREEHOLD,
        price: 420000,
        bankValue: null,
        competitorPriceRange: null,
        size: 550,
        bedrooms: 1,
        bathrooms: 1,
        location: "Bukit Bintang, Kuala Lumpur",
        buildingProject: null,
        status: ListingStatus.WITHDRAWN,
        lastEnquiryAt: addDays(now, -14),
        photos: [],
        videos: [],
        documents: [],
        externalLinks: [],
        createdAt: addDays(now, -45),
        updatedAt: addDays(now, -14)
      }),
      listingsRepo.create({
        id: uuidFor(seedKey, "listing", "dual-market-1"),
        propertyName: "Mont Kiara Dual-Market (Sale & Rent)",
        lotUnitNo: "B-10-02",
        type: "Condominium",
        category: ListingCategory.FOR_SALE_AND_RENT,
        tenure: ListingTenure.LEASEHOLD,
        price: 1580000,
        bankValue: 1510000,
        competitorPriceRange: "1.50m - 1.65m",
        size: 1350,
        bedrooms: 4,
        bathrooms: 3,
        location: "Mont Kiara, Kuala Lumpur",
        buildingProject: "Kiara Crest",
        status: ListingStatus.ACTIVE,
        expiresAt: addDays(now, 7),
        photos: [
          {
            url: "https://images.unsplash.com/photo-1484154218962-a197022b5858",
            label: "Living"
          },
          {
            url: "https://images.unsplash.com/photo-1501183638710-841dd1904471",
            label: "Bedroom"
          }
        ],
        videos: [{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", label: "Walkthrough" }],
        documents: [
          { url: "https://example.com/spa.pdf", label: "SPA" },
          { url: "https://example.com/floorplan.pdf", label: "Floor Plan" }
        ],
        externalLinks: [
          { provider: "iProperty", url: "https://iproperty.com.my/listing/mont-kiara-demo", expiresAt: addDays(now, 7) },
          { provider: "Other", url: "https://example.com/listings/mont-kiara-demo", expiresAt: addDays(now, 365) }
        ],
        createdAt: addDays(now, -2),
        updatedAt: now
      }),
      listingsRepo.create({
        id: uuidFor(seedKey, "listing", "booked-1"),
        propertyName: "Booked Terrace (Edge Case)",
        lotUnitNo: null,
        type: "Landed",
        category: ListingCategory.BOOKED,
        tenure: ListingTenure.FREEHOLD,
        price: 890000,
        bankValue: 940000,
        competitorPriceRange: "860k - 920k",
        size: 1800,
        bedrooms: 4,
        bathrooms: 3,
        location: "Subang Jaya, Selangor",
        buildingProject: null,
        status: ListingStatus.ACTIVE,
        lastEnquiryAt: addDays(now, -1),
        photos: [],
        videos: [],
        documents: [],
        externalLinks: [{ provider: "Other", url: "https://example.com/listings/booked-demo" }],
        createdAt: addDays(now, -6),
        updatedAt: addDays(now, -1)
      })
    ];

    await listingsRepo.upsert(
      demoListings.map((listing) => ({
        ...listing,
        buildingProject: listing.buildingProject ?? null,
        lotUnitNo: listing.lotUnitNo ?? null,
        bankValue: listing.bankValue ?? null,
        competitorPriceRange: listing.competitorPriceRange ?? null
      })),
      ["id"]
    );

    const viewingStageByListingId = new Map<string, string>();

    const processLogs: Array<Partial<ProcessLogEntity>> = [
      {
        id: uuidFor(seedKey, "processLog", demoListings[0].id, ProcessStage.OWNER_APPOINTMENT),
        listingId: demoListings[0].id,
        stage: ProcessStage.OWNER_APPOINTMENT,
        actor: "Alicia",
        completedAt: addDays(now, -9),
        createdAt: addDays(now, -9),
        updatedAt: addDays(now, -9)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[0].id, ProcessStage.MARKETING_ACTIVATION),
        listingId: demoListings[0].id,
        stage: ProcessStage.MARKETING_ACTIVATION,
        actor: "Alicia",
        completedAt: addDays(now, -7),
        createdAt: addDays(now, -7),
        updatedAt: addDays(now, -7)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[0].id, ProcessStage.VIEWING_RECORD),
        listingId: demoListings[0].id,
        stage: ProcessStage.VIEWING_RECORD,
        actor: "Alicia",
        notes: "Prospect loves view",
        completedAt: addDays(now, -2),
        createdAt: addDays(now, -5),
        updatedAt: addDays(now, -2)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[1].id, ProcessStage.OWNER_APPOINTMENT),
        listingId: demoListings[1].id,
        stage: ProcessStage.OWNER_APPOINTMENT,
        actor: "Irfan",
        completedAt: addDays(now, -25),
        createdAt: addDays(now, -25),
        updatedAt: addDays(now, -25)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[1].id, ProcessStage.MARKETING_ACTIVATION),
        listingId: demoListings[1].id,
        stage: ProcessStage.MARKETING_ACTIVATION,
        actor: "Irfan",
        completedAt: addDays(now, -23),
        createdAt: addDays(now, -23),
        updatedAt: addDays(now, -23)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[1].id, ProcessStage.VIEWING_RECORD),
        listingId: demoListings[1].id,
        stage: ProcessStage.VIEWING_RECORD,
        actor: "Irfan",
        notes: "2 families viewed",
        completedAt: addDays(now, -18),
        createdAt: addDays(now, -19),
        updatedAt: addDays(now, -18)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[1].id, ProcessStage.OFFER_STAGE),
        listingId: demoListings[1].id,
        stage: ProcessStage.OFFER_STAGE,
        notes: "LOI at RM3.1M in review",
        completedAt: addDays(now, -1),
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[2].id, ProcessStage.OWNER_APPOINTMENT),
        listingId: demoListings[2].id,
        stage: ProcessStage.OWNER_APPOINTMENT,
        actor: "Demo Agent",
        completedAt: addDays(now, -70),
        createdAt: addDays(now, -70),
        updatedAt: addDays(now, -70)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[2].id, ProcessStage.KEY_HANDOVER),
        listingId: demoListings[2].id,
        stage: ProcessStage.KEY_HANDOVER,
        actor: "Demo Agent",
        completedAt: addDays(now, -20),
        createdAt: addDays(now, -20),
        updatedAt: addDays(now, -20)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[2].id, ProcessStage.LOAN_CONSENT),
        listingId: demoListings[2].id,
        stage: ProcessStage.LOAN_CONSENT,
        actor: "Bank Officer",
        notes: "Loan + consent processed (alias stage demo).",
        completedAt: addDays(now, -40),
        createdAt: addDays(now, -42),
        updatedAt: addDays(now, -40)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[2].id, ProcessStage.LEGAL_STAGE),
        listingId: demoListings[2].id,
        stage: ProcessStage.LEGAL_STAGE,
        actor: "Conveyancing Lawyer",
        notes: "SPA signed and adjudicated.",
        completedAt: addDays(now, -30),
        createdAt: addDays(now, -34),
        updatedAt: addDays(now, -30)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[2].id, ProcessStage.BALANCE_PURCHASE_PRICE_DISBURSEMENT),
        listingId: demoListings[2].id,
        stage: ProcessStage.BALANCE_PURCHASE_PRICE_DISBURSEMENT,
        actor: "Bank Officer",
        notes: "BPP disbursed to vendor.",
        completedAt: addDays(now, -22),
        createdAt: addDays(now, -24),
        updatedAt: addDays(now, -22)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[0].id, ProcessStage.OFFER_STAGE),
        listingId: demoListings[0].id,
        stage: ProcessStage.OFFER_STAGE,
        actor: "Demo Agent",
        notes: "Offer discussions ongoing (in-progress stage).",
        completedAt: null,
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[3].id, ProcessStage.LEGAL_STAGE),
        listingId: demoListings[3].id,
        stage: ProcessStage.LEGAL_STAGE,
        actor: "Property Manager",
        notes: "Tenancy agreement signed.",
        completedAt: addDays(now, -62),
        createdAt: addDays(now, -65),
        updatedAt: addDays(now, -62)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[3].id, ProcessStage.BALANCE_PURCHASE_PRICE_DISBURSEMENT),
        listingId: demoListings[3].id,
        stage: ProcessStage.BALANCE_PURCHASE_PRICE_DISBURSEMENT,
        actor: "Property Manager",
        notes: "Deposit + first month collected (rent timeline edge case).",
        completedAt: addDays(now, -60),
        createdAt: addDays(now, -61),
        updatedAt: addDays(now, -60)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[6].id, ProcessStage.OWNER_APPOINTMENT),
        listingId: demoListings[6].id,
        stage: ProcessStage.OWNER_APPOINTMENT,
        actor: "Demo Agent",
        completedAt: addDays(now, -2),
        createdAt: addDays(now, -2),
        updatedAt: addDays(now, -2)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[6].id, ProcessStage.MARKETING_ACTIVATION),
        listingId: demoListings[6].id,
        stage: ProcessStage.MARKETING_ACTIVATION,
        actor: "Demo Agent",
        completedAt: addDays(now, -1),
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[6].id, ProcessStage.VIEWING_RECORD),
        listingId: demoListings[6].id,
        stage: ProcessStage.VIEWING_RECORD,
        actor: "Demo Agent",
        notes: "Multiple enquiries from dual-market audience.",
        completedAt: addDays(now, -1),
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "processLog", demoListings[6].id, ProcessStage.LOAN_CONSENT),
        listingId: demoListings[6].id,
        stage: ProcessStage.LOAN_CONSENT,
        actor: "Bank Officer",
        notes: "Alias stage covers Loan Application + Consent Application.",
        completedAt: null,
        createdAt: now,
        updatedAt: now
      }
    ];

    const seededListingIds = demoListings.map((listing) => listing.id);
    const existingLogs = await processLogsRepo.find({
      where: { listingId: In(seededListingIds) }
    });
    const existingLogIdByKey = new Map<string, string>();
    for (const log of existingLogs) {
      existingLogIdByKey.set(`${log.listingId}:${log.stage}`, log.id);
    }

    for (const log of processLogs) {
      if (!log.listingId || !log.stage) {
        continue;
      }
      const existingId = existingLogIdByKey.get(`${log.listingId}:${log.stage}`);
      if (existingId) {
        log.id = existingId;
      }
      if (log.stage === ProcessStage.VIEWING_RECORD && log.id) {
        viewingStageByListingId.set(log.listingId, log.id);
      }
    }

    await processLogsRepo.upsert(processLogs, ["id"]);

    const viewingLogForListing1 = viewingStageByListingId.get(demoListings[0].id);
    const viewingLogForListing2 = viewingStageByListingId.get(demoListings[1].id);
    const viewingLogForListingDualMarket = viewingStageByListingId.get(demoListings[6].id);

    const viewings: Array<Partial<ProcessViewingEntity>> = [
      ...(viewingLogForListing1
        ? [
            {
              id: uuidFor(seedKey, "viewing", demoListings[0].id, "lim-wei-han"),
              listingId: demoListings[0].id,
              processLogId: viewingLogForListing1,
              name: "Lim Wei Han",
              phone: "+60 12-345 6789",
              email: null,
              notes: "Prefers evening viewings, wants price justification.",
              viewedAt: addDays(now, -5),
              isSuccessfulBuyer: false,
              createdAt: addDays(now, -5),
              updatedAt: addDays(now, -5)
            },
            {
              id: uuidFor(seedKey, "viewing", demoListings[0].id, "nor-aini"),
              listingId: demoListings[0].id,
              processLogId: viewingLogForListing1,
              name: "Nor Aini",
              phone: "+60 16-111 2222",
              email: "aini@example.com",
              notes: "Family of 4, loved pool view.",
              viewedAt: addDays(now, -3),
              isSuccessfulBuyer: true,
              createdAt: addDays(now, -3),
              updatedAt: addDays(now, -3)
            },
            {
              id: uuidFor(seedKey, "viewing", demoListings[0].id, "scheduled-null-date"),
              listingId: demoListings[0].id,
              processLogId: viewingLogForListing1,
              name: "Walk-in (Scheduled)",
              phone: "012-000 9999",
              email: "walkin@example.com",
              notes: "ViewedAt intentionally null to exercise sorting + UI copy.",
              viewedAt: null,
              isSuccessfulBuyer: false,
              createdAt: addDays(now, -4),
              updatedAt: addDays(now, -4)
            },
            {
              id: uuidFor(seedKey, "viewing", demoListings[0].id, "upcoming"),
              listingId: demoListings[0].id,
              processLogId: viewingLogForListing1,
              name: "Upcoming Viewing (Demo)",
              phone: "+60 11-2222 3333",
              email: "upcoming@example.com",
              notes: "Shows up in reminders dashboard as an appointment.",
              viewedAt: addDays(now, 2),
              isSuccessfulBuyer: false,
              createdAt: now,
              updatedAt: now
            }
          ]
        : []),
      ...(viewingLogForListing2
        ? [
            {
              id: uuidFor(seedKey, "viewing", demoListings[1].id, "chan-prop"),
              listingId: demoListings[1].id,
              processLogId: viewingLogForListing2,
              name: "Chan Properties Sdn Bhd",
              phone: null,
              email: "director@chanprop.my",
              notes: "Corporate lease interest",
              viewedAt: addDays(now, -19),
              isSuccessfulBuyer: false,
              createdAt: addDays(now, -19),
              updatedAt: addDays(now, -19)
            }
          ]
        : [])
      ,
      ...(viewingLogForListingDualMarket
        ? [
            {
              id: uuidFor(seedKey, "viewing", demoListings[6].id, "dual-market-1"),
              listingId: demoListings[6].id,
              processLogId: viewingLogForListingDualMarket,
              name: "Farah (Dual-Market)",
              phone: "+60 18-123 4567",
              email: null,
              notes: "Considering rent first, then buy within 12 months.",
              viewedAt: addDays(now, -1),
              isSuccessfulBuyer: false,
              createdAt: addDays(now, -1),
              updatedAt: addDays(now, -1)
            }
          ]
        : [])
    ];

    await viewingsRepo.upsert(viewings, ["id"]);

    const leads: Array<Partial<LeadEntity>> = [
      {
        id: uuidFor(seedKey, "lead", "aini"),
        userId: seedUserId,
        listingId: demoListings[0].id,
        name: "Nor Aini",
        phone: "+60 16-111 2222",
        phoneNormalized: normalizePhone("+60 16-111 2222"),
        email: "aini@example.com",
        emailNormalized: normalizeEmail("aini@example.com"),
        source: "viewing",
        status: "CONTACTED",
        message: "Follow up with price breakdown and financing options.",
        lastContactedAt: addDays(now, -2),
        createdAt: addDays(now, -3),
        updatedAt: addDays(now, -2)
      },
      {
        id: uuidFor(seedKey, "lead", "lim"),
        userId: seedUserId,
        listingId: demoListings[0].id,
        name: "Lim Wei Han",
        phone: "+60 12-345 6789",
        phoneNormalized: normalizePhone("+60 12-345 6789"),
        email: null,
        emailNormalized: null,
        source: "viewing",
        status: "QUALIFIED",
        message: "Requested comparable listings and price negotiation range.",
        lastContactedAt: addDays(now, -1),
        createdAt: addDays(now, -5),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "lead", "new-1"),
        userId: seedUserId,
        listingId: demoListings[1].id,
        name: "Nadia (Instagram DM)",
        phone: "+60 19-888 0000",
        phoneNormalized: normalizePhone("+60 19-888 0000"),
        email: "nadia@example.com",
        emailNormalized: normalizeEmail("nadia@example.com"),
        source: "instagram",
        status: "NEW",
        message: "Interested in viewing next weekend.",
        lastContactedAt: null,
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "lead", "won-1"),
        userId: seedUserId,
        listingId: demoListings[2].id,
        name: "Jason Tan",
        phone: null,
        phoneNormalized: null,
        email: "jason.tan@example.com",
        emailNormalized: normalizeEmail("jason.tan@example.com"),
        source: "referral",
        status: "WON",
        message: "Closed successfully. Good for testimonial follow-up.",
        lastContactedAt: addDays(now, -20),
        createdAt: addDays(now, -52),
        updatedAt: addDays(now, -20)
      },
      {
        id: uuidFor(seedKey, "lead", "lost-1"),
        userId: seedUserId,
        listingId: demoListings[1].id,
        name: "Budget Shopper (Lost)",
        phone: "012-345 6789",
        phoneNormalized: normalizePhone("012-345 6789"),
        email: "budget@example.com",
        emailNormalized: normalizeEmail("budget@example.com"),
        source: "portal",
        status: "LOST",
        message: "Chose a competitor listing.",
        lastContactedAt: addDays(now, -10),
        createdAt: addDays(now, -22),
        updatedAt: addDays(now, -10)
      }
    ];

    await leadsRepo.upsert(leads, ["id"]);

    const reminders: Array<Partial<ReminderEntity>> = [
      {
        id: uuidFor(seedKey, "reminder", "portal-expiry"),
        userId: seedUserId,
        listingId: demoListings[0].id,
        type: "PORTAL_EXPIRY",
        status: "PENDING",
        dueAt: addDays(now, 3),
        message: "Mudah ad expiring in 3 days.",
        recurrence: "NONE",
        recurrenceInterval: 1,
        metadata: { kind: "DEMO", provider: "Mudah" },
        completedAt: null,
        dismissedAt: null,
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "reminder", "exclusive-appointment"),
        userId: seedUserId,
        listingId: demoListings[1].id,
        type: "EXCLUSIVE_APPOINTMENT",
        status: "PENDING",
        dueAt: addDays(now, 5),
        message: "Exclusive appointment letter expires in 7 days.",
        recurrence: "NONE",
        recurrenceInterval: 1,
        metadata: { kind: "DEMO" },
        completedAt: null,
        dismissedAt: null,
        createdAt: addDays(now, -2),
        updatedAt: addDays(now, -2)
      },
      {
        id: uuidFor(seedKey, "reminder", "tenancy-renewal"),
        userId: seedUserId,
        listingId: demoListings[0].id,
        type: "TENANCY_RENEWAL",
        status: "PENDING",
        dueAt: addDays(now, 45),
        message: "Tenancy renewal alert. Engage tenant.",
        recurrence: "NONE",
        recurrenceInterval: 1,
        metadata: { kind: "DEMO" },
        completedAt: null,
        dismissedAt: null,
        createdAt: addDays(now, -3),
        updatedAt: addDays(now, -3)
      },
      {
        id: uuidFor(seedKey, "reminder", "lead-followup"),
        userId: seedUserId,
        listingId: demoListings[0].id,
        type: "LEAD_FOLLOWUP",
        status: "PENDING",
        dueAt: addDays(now, 1),
        message: "Follow up with Nor Aini after viewing.",
        recurrence: "WEEKLY",
        recurrenceInterval: 1,
        metadata: { kind: "DEMO", leadId: leads[0].id },
        completedAt: null,
        dismissedAt: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidFor(seedKey, "reminder", "owner-update"),
        userId: seedUserId,
        listingId: demoListings[2].id,
        type: "OWNER_UPDATE",
        status: "DONE",
        dueAt: addDays(now, -6),
        message: "Update owner after key handover.",
        recurrence: "NONE",
        recurrenceInterval: 1,
        metadata: { kind: "DEMO" },
        completedAt: addDays(now, -6),
        dismissedAt: null,
        createdAt: addDays(now, -7),
        updatedAt: addDays(now, -6)
      },
      {
        id: uuidFor(seedKey, "reminder", "dismissed-1"),
        userId: seedUserId,
        listingId: demoListings[4].id,
        type: "LISTING_EVENT",
        status: "DISMISSED",
        dueAt: addDays(now, -4),
        message: "Open house canceled (dismissed reminder demo).",
        recurrence: "NONE",
        recurrenceInterval: 1,
        metadata: { kind: "DEMO", reason: "owner_rescheduled" },
        completedAt: null,
        dismissedAt: addDays(now, -4),
        createdAt: addDays(now, -5),
        updatedAt: addDays(now, -4)
      },
      {
        id: uuidFor(seedKey, "reminder", "platform-listing-expiry-1"),
        userId: seedUserId,
        listingId: demoListings[0].id,
        type: "PLATFORM_LISTING_EXPIRY",
        status: "PENDING",
        dueAt: addDays(now, 10),
        message: "PropertyGuru boost expires soon (platform expiry demo).",
        recurrence: "MONTHLY",
        recurrenceInterval: 1,
        metadata: { kind: "DEMO", provider: "PropertyGuru" },
        completedAt: null,
        dismissedAt: null,
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      },
      {
        id: uuidFor(seedKey, "reminder", "no-listing-1"),
        userId: seedUserId,
        listingId: null,
        type: "LEAD_FOLLOWUP",
        status: "PENDING",
        dueAt: addDays(now, 14),
        message: "General follow-up reminder (no listing attached).",
        recurrence: "MONTHLY",
        recurrenceInterval: 2,
        metadata: { kind: "DEMO", channel: "WhatsApp" },
        completedAt: null,
        dismissedAt: null,
        createdAt: now,
        updatedAt: now
      }
    ];

    await remindersRepo.save(remindersRepo.create(reminders));

    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const existingAnnual = await targetsRepo.findOne({
      where: { userId: seedUserId, year, month: IsNull() }
    });

    const annualTarget = {
      id: existingAnnual?.id ?? uuidFor(seedKey, "target", "annual", year),
      userId: seedUserId,
      year,
      month: null,
      targetUnits: 18,
      targetCommission: 220000
    } satisfies Partial<TargetEntity>;

    await targetsRepo.save(targetsRepo.create(annualTarget));

    const monthlyTargets: Array<Partial<TargetEntity>> = [
      {
        id: uuidFor(seedKey, "target", year, month),
        userId: seedUserId,
        year,
        month,
        targetUnits: 2,
        targetCommission: 28000
      },
      {
        id: uuidFor(seedKey, "target", year, month - 1),
        userId: seedUserId,
        year,
        month: month - 1,
        targetUnits: 2,
        targetCommission: 26000
      }
    ];

    await targetsRepo.upsert(
      monthlyTargets.filter((target) => (target.month ?? 0) >= 1),
      ["userId", "year", "month"]
    );

    const expenses: Array<Partial<ExpenseEntity>> = [
      {
        id: uuidFor(seedKey, "expense", "fuel-1"),
        userId: seedUserId,
        category: ExpenseCategory.FUEL,
        amount: 120.5,
        description: "Client viewing fuel + tolls",
        date: addDays(now, -3),
        receiptUrl: null
      },
      {
        id: uuidFor(seedKey, "expense", "ads-1"),
        userId: seedUserId,
        category: ExpenseCategory.ADVERTISING,
        amount: 350,
        description: "Portal boosts (Mudah + PropertyGuru)",
        date: addDays(now, -12),
        receiptUrl: null
      },
      {
        id: uuidFor(seedKey, "expense", "printing-1"),
        userId: seedUserId,
        category: ExpenseCategory.PRINTING,
        amount: 75,
        description: "Flyers & appointment letter prints",
        date: addDays(now, -22),
        receiptUrl: null
      },
      {
        id: uuidFor(seedKey, "expense", "office-1"),
        userId: seedUserId,
        category: ExpenseCategory.OFFICE,
        amount: 55.9,
        description: "Stationery + document folders",
        date: addDays(now, -30),
        receiptUrl: null
      },
      {
        id: uuidFor(seedKey, "expense", "professional-fees-1"),
        userId: seedUserId,
        category: ExpenseCategory.PROFESSIONAL_FEES,
        amount: 480,
        description: "Runner + admin fees",
        date: addDays(now, -40),
        receiptUrl: "https://example.com/receipt/pro-fees.pdf"
      },
      {
        id: uuidFor(seedKey, "expense", "transport-1"),
        userId: seedUserId,
        category: ExpenseCategory.TRANSPORTATION,
        amount: 38.2,
        description: "Parking + LRT trips",
        date: addDays(now, -8),
        receiptUrl: null
      },
      {
        id: uuidFor(seedKey, "expense", "entertainment-1"),
        userId: seedUserId,
        category: ExpenseCategory.ENTERTAINMENT,
        amount: 210,
        description: "Client coffee meeting",
        date: addDays(now, -6),
        receiptUrl: null
      },
      {
        id: uuidFor(seedKey, "expense", "other-1"),
        userId: seedUserId,
        category: ExpenseCategory.OTHER,
        amount: 25,
        description: "Misc tools",
        date: addDays(now, -2),
        receiptUrl: null
      }
    ];

    await expensesRepo.upsert(expenses, ["id"]);

    const commissions: Array<Partial<CommissionEntity>> = [
      {
        id: uuidFor(seedKey, "commission", "sale-1"),
        userId: seedUserId,
        listingId: demoListings[2].id,
        amount: 33600,
        closedDate: addDays(now, -21),
        notes: "Demo closed sale commission."
      },
      {
        id: uuidFor(seedKey, "commission", "rent-1"),
        userId: seedUserId,
        listingId: demoListings[3].id,
        amount: 2600,
        closedDate: addDays(now, -60),
        notes: "Demo tenancy commission."
      },
      {
        id: uuidFor(seedKey, "commission", "manual-1"),
        userId: seedUserId,
        listingId: null,
        amount: 1800,
        closedDate: addDays(now, -8),
        notes: "Manual commission entry (no linked listing)."
      }
    ];

    await commissionsRepo.upsert(commissions, ["id"]);

    const subscriptionConfig = loadSubscriptionConfig();
    const existingSubscription = await subscriptionsRepo.findOne({
      where: { userId: seedUserId }
    });

    const subscription = existingSubscription
      ? Object.assign(existingSubscription, {
          status: SubscriptionStatus.ACTIVE,
          planAmount: subscriptionConfig.plan.amount,
          planCurrency: subscriptionConfig.plan.currency,
          planInterval: subscriptionConfig.plan.interval,
          trialEndsAt: null,
          nextBillingAt: addDays(now, 30),
          graceEndsAt: null,
          canceledAt: null,
          metadata: { seeded: true, plan: subscriptionConfig.plan.code },
          updatedAt: now
        } satisfies Partial<SubscriptionEntity>)
      : subscriptionsRepo.create({
          id: uuidFor(seedKey, "subscription"),
          userId: seedUserId,
          providerReference: `sub_${seedUserId}_demo`,
          providerRecurringId: null,
          status: SubscriptionStatus.ACTIVE,
          planAmount: subscriptionConfig.plan.amount,
          planCurrency: subscriptionConfig.plan.currency,
          planInterval: subscriptionConfig.plan.interval,
          trialEndsAt: null,
          nextBillingAt: addDays(now, 30),
          graceEndsAt: null,
          canceledAt: null,
          metadata: { seeded: true, plan: subscriptionConfig.plan.code },
          createdAt: addDays(now, -15),
          updatedAt: now
        });

    const savedSubscription = await subscriptionsRepo.save(subscription);

    const invoices: Array<Partial<SubscriptionInvoiceEntity>> = [
      {
        id: uuidFor(seedKey, "invoice", "paid-1"),
        subscriptionId: savedSubscription.id,
        userId: seedUserId,
        providerPaymentId: `pay_${seedUserId}_demo_1`,
        status: "Paid",
        amount: subscriptionConfig.plan.amount,
        currency: subscriptionConfig.plan.currency,
        paidAt: addDays(now, -14),
        failedAt: null,
        rawPayload: { seeded: true, status: "paid" },
        createdAt: addDays(now, -14),
        updatedAt: addDays(now, -14)
      },
      {
        id: uuidFor(seedKey, "invoice", "pending-1"),
        subscriptionId: savedSubscription.id,
        userId: seedUserId,
        providerPaymentId: `pay_${seedUserId}_demo_2`,
        status: "Pending",
        amount: subscriptionConfig.plan.amount,
        currency: subscriptionConfig.plan.currency,
        paidAt: null,
        failedAt: null,
        rawPayload: { seeded: true, status: "pending" },
        createdAt: addDays(now, -2),
        updatedAt: addDays(now, -2)
      },
      {
        id: uuidFor(seedKey, "invoice", "failed-1"),
        subscriptionId: savedSubscription.id,
        userId: seedUserId,
        providerPaymentId: `pay_${seedUserId}_demo_3`,
        status: "Failed",
        amount: subscriptionConfig.plan.amount,
        currency: subscriptionConfig.plan.currency,
        paidAt: null,
        failedAt: addDays(now, -1),
        rawPayload: { seeded: true, status: "failed" },
        createdAt: addDays(now, -1),
        updatedAt: addDays(now, -1)
      }
    ];

    const invoicePaymentIds = invoices
      .map((invoice) => invoice.providerPaymentId)
      .filter((value): value is string => Boolean(value));
    const existingInvoices = invoicePaymentIds.length
      ? await invoicesRepo.find({
          where: { providerPaymentId: In(invoicePaymentIds) }
        })
      : [];
    const existingInvoiceIdByPaymentId = new Map<string, string>();
    for (const invoice of existingInvoices) {
      if (invoice.providerPaymentId) {
        existingInvoiceIdByPaymentId.set(invoice.providerPaymentId, invoice.id);
      }
    }

    for (const invoice of invoices) {
      const paymentId = invoice.providerPaymentId;
      if (!paymentId) {
        continue;
      }
      const existingId = existingInvoiceIdByPaymentId.get(paymentId);
      if (existingId) {
        invoice.id = existingId;
      }
    }

    await invoicesRepo.save(invoicesRepo.create(invoices));

    console.log("✅ Demo seed complete.");
    console.log(`- Seeded userId: ${seedUserId}`);
    if (options.createAuthUser) {
      console.log(`- Better-auth login: ${options.email} / ${options.password}`);
    }
    console.log(`- Seeded listings: ${demoListings.length}`);
    const ownerLinkSecret = process.env.OWNER_LINK_SECRET;
    if (ownerLinkSecret) {
      const token = generateOwnerViewToken(demoListings[0].id, 30, ownerLinkSecret);
      const encoded = encodeOwnerViewTokenForUrl(token);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
      console.log(`- Owner view link (30d): ${appUrl.replace(/\/$/, "")}/owner/${encoded}`);
    }
    console.log(`- Tip: run with --reset to re-seed from scratch`);
  } finally {
    await dataSource.destroy();
  }
}

async function run() {
  loadEnvFiles();
  const options = parseOptions();

  try {
    await seed(options);
  } catch (error) {
    console.error("❌ Failed to seed demo data");
    console.error(error);
    process.exit(1);
  }
}

run();
