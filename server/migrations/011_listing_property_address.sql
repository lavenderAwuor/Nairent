-- Adds the public property address used by listing maps.
ALTER TABLE listings
ADD COLUMN property_address VARCHAR(300);
