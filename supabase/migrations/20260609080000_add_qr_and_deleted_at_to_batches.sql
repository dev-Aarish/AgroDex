-- Add qr_code_url and deleted_at columns to batches table
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for deleted_at queries
CREATE INDEX IF NOT EXISTS idx_batches_deleted_at ON batches(deleted_at);
