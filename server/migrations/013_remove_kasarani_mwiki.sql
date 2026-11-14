-- Merges Kasarani Mwiki records into Kasarani, then removes that location.
DO $$
DECLARE
  legacy_location_id UUID;
  kasarani_location_id UUID;
BEGIN
  SELECT id INTO legacy_location_id
  FROM locations
  WHERE LOWER(name) = LOWER('Kasarani Mwiki');

  IF legacy_location_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO kasarani_location_id
  FROM locations
  WHERE LOWER(name) = LOWER('Kasarani');

  IF kasarani_location_id IS NULL THEN
    INSERT INTO locations (name, latitude, longitude)
    VALUES ('Kasarani', -1.2219, 36.8976)
    RETURNING id INTO kasarani_location_id;
  END IF;

  UPDATE listings
  SET location_id = kasarani_location_id, updated_at = NOW()
  WHERE location_id = legacy_location_id;

  UPDATE saved_searches
  SET location_id = kasarani_location_id
  WHERE location_id = legacy_location_id;

  UPDATE recommendations
  SET location_id = kasarani_location_id
  WHERE location_id = legacy_location_id;

  DELETE FROM locations
  WHERE id = legacy_location_id;
END $$;
