-- Adds Utawala to the searchable Nairobi locations.
INSERT INTO locations (name, latitude, longitude)
VALUES ('Utawala', -1.2858, 36.9582)
ON CONFLICT (name) DO UPDATE
SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;
