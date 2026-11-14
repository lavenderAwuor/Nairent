-- Allows listers to set a non-negative viewing fee per property.
ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_no_viewing_fee;

ALTER TABLE listings
  ADD CONSTRAINT listings_viewing_fee_check CHECK (viewing_fee >= 0);
