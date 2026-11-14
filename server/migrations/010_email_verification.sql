-- Adds verified-email state and one-time email confirmation tokens.
ALTER TABLE users
  ADD COLUMN email_verified_at TIMESTAMPTZ;

-- Existing accounts predate email verification. Preserve their current access;
-- all accounts created after this migration start unverified.
UPDATE users
SET email_verified_at = created_at
WHERE email_verified_at IS NULL;

CREATE TABLE email_verification_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX email_verification_tokens_user_id_idx
  ON email_verification_tokens (user_id);

CREATE INDEX email_verification_tokens_expires_at_idx
  ON email_verification_tokens (expires_at);
