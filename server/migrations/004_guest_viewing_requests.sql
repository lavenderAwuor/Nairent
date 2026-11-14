-- Allows guests to request viewing appointments without an account.
ALTER TABLE viewing_appointments
  ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE viewing_appointments
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS guest_email CITEXT;
