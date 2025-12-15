CREATE TABLE IF NOT EXISTS "profiles" (
    "id" varchar(255) PRIMARY KEY,
    "name" varchar(255) NOT NULL,
    "email" varchar(255) NOT NULL,
    "phone" varchar(40),
    "agency" varchar(80),
    "role" varchar(80),
    "bio" text,
    "avatarUrl" text,
    "coverUrl" text,
    "timezone" varchar(64) NOT NULL,
    "language" varchar(64) NOT NULL,
    "whatsapp" varchar(40),
    "notifications" jsonb NOT NULL DEFAULT '{"reminders":true,"smartDigest":true,"productUpdates":false}',
    "createdAt" timestamptz NOT NULL DEFAULT now(),
    "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updatedat_camel_column();

