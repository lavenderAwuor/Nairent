-- Adds structured amenity data to rental listings.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb;
