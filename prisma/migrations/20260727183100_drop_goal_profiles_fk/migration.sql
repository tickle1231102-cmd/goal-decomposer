-- Goal.userId references auth.users.id in application code only.
-- Drop FK to Focal's public.profiles to avoid cross-app conflicts.
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_userId_fkey";
