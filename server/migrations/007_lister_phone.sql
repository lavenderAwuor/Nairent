-- Adds phone contact details to user accounts.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
