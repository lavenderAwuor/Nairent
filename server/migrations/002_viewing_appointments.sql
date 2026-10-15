CREATE TYPE appointment_status AS ENUM ('requested', 'confirmed', 'declined', 'cancelled', 'completed');

CREATE TABLE viewing_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  note TEXT,
  status appointment_status NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, tenant_id, preferred_date, preferred_time)
);

CREATE INDEX listings_search_idx
  ON listings (location_id, monthly_rent, bedrooms, availability_status, moderation_status);

CREATE INDEX viewing_appointments_tenant_idx
  ON viewing_appointments (tenant_id, created_at DESC);
