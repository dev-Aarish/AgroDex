-- Add status column to batches table if it does not exist
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'registered';
