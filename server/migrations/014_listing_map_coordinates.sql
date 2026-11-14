-- Stores each lister-selected property point separately from its neighborhood center.
ALTER TABLE listings
  ADD COLUMN latitude NUMERIC(9, 6),
  ADD COLUMN longitude NUMERIC(9, 6),
  ADD CONSTRAINT listings_coordinates_pair_check CHECK (
    (latitude IS NULL AND longitude IS NULL)
    OR (
      latitude IS NOT NULL AND longitude IS NOT NULL
      AND latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180
    )
  );
