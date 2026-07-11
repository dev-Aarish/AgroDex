-- Step 1: Add column without a default (no rewrite, instant on PG 11+)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Step 2: Backfill existing rows with best available timestamp
UPDATE public.profiles
SET last_active_at = COALESCE(last_active_at, updated_at, created_at, NOW());

-- Step 3: Lock in NOT NULL + DEFAULT for future inserts
ALTER TABLE public.profiles
ALTER COLUMN last_active_at SET NOT NULL,
ALTER COLUMN last_active_at SET DEFAULT NOW();

-- Step 4: Index for the cron cleanup query
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at
ON public.profiles(last_active_at);
