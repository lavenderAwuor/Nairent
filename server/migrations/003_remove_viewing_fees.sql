UPDATE listings SET viewing_fee = 0 WHERE viewing_fee <> 0;

ALTER TABLE listings
  DROP CONSTRAINT IF EXISTS listings_viewing_fee_check;

ALTER TABLE listings
  ADD CONSTRAINT listings_no_viewing_fee CHECK (viewing_fee = 0);
