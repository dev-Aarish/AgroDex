-- Add farmer_id (Supabase auth user UUID) to batches table
-- This links each batch to the authenticated user who registered it,
-- enabling per-farmer fraud scoring and risk ranking.

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for fast farmer-based lookups
CREATE INDEX IF NOT EXISTS idx_batches_farmer_id ON batches(farmer_id);

-- Comment for documentation
COMMENT ON COLUMN batches.farmer_id IS 'Supabase auth user UUID of the farmer who registered this batch';
