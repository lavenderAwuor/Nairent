-- Stores support requests submitted through the public help page.
CREATE TABLE support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email CITEXT NOT NULL,
  topic VARCHAR(30) NOT NULL CHECK (topic IN ('account', 'listing', 'viewing', 'technical', 'other')),
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX support_requests_status_created_idx ON support_requests (status, created_at DESC);
