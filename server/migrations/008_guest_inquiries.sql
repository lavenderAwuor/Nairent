-- Adds guest and tenant messages for rental listings.
ALTER TABLE inquiries
  ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS guest_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS guest_email CITEXT,
  ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(32);
