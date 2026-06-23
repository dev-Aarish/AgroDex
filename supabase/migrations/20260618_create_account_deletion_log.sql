-- Audit log for account deletions.
-- Stores ONLY user_id + timestamp — no email, name, or wallet id (no PII).
--
-- user_id is a plain UUID, NOT a foreign key to auth.users.
-- A FK would cascade-delete this row when the user is deleted,
-- defeating the purpose of a log that must outlive the account.

CREATE TABLE IF NOT EXISTS public.account_deletion_log (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.account_deletion_log.user_id IS
  'User UUID preserved for audit trail. NOT a FK — intentionally orphaned
   after user deletion so the record survives the cascade.';

ALTER TABLE public.account_deletion_log ENABLE ROW LEVEL SECURITY;
-- No policies defined. anon and authenticated roles have zero access.
-- service_role (backend) bypasses RLS entirely — no policy needed.

CREATE INDEX IF NOT EXISTS idx_account_deletion_log_user_id
  ON public.account_deletion_log(user_id);

CREATE INDEX IF NOT EXISTS idx_account_deletion_log_deleted_at
  ON public.account_deletion_log(deleted_at);
