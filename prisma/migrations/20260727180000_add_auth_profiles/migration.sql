-- User profiles (linked to Supabase auth.users by id)
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "avatar_url" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "is_guest" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Scope goals to authenticated / guest users
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "userId" UUID;

CREATE INDEX IF NOT EXISTS "Goal_userId_idx" ON "Goal"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Goal_userId_fkey'
  ) THEN
    ALTER TABLE "Goal"
      ADD CONSTRAINT "Goal_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "profiles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
