-- Adds saved-search email preferences and the alert delivery queue.
ALTER TABLE saved_searches
  ADD COLUMN notify_new_listings BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE listing_alert_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'cancelled', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  UNIQUE (tenant_id, listing_id)
);

CREATE INDEX listing_alert_outbox_pending_idx
  ON listing_alert_outbox (available_at, created_at)
  WHERE status IN ('pending', 'sending');
