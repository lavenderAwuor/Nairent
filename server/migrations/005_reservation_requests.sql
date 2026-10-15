CREATE TYPE reservation_status AS ENUM ('requested', 'accepted', 'declined', 'cancelled');

CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  guest_name VARCHAR(120) NOT NULL,
  guest_email CITEXT NOT NULL,
  move_in_date DATE,
  note TEXT,
  status reservation_status NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reservations_listing_idx ON reservations (listing_id, created_at DESC);
