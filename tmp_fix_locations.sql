WITH flattened AS (
  SELECT id,
    (CASE WHEN jsonb_typeof(item) = 'array' THEN jsonb_array_elements_text(item)
          ELSE trim(both '"' from item::text) END) AS txt
  FROM public.campaigns, jsonb_array_elements(locations) AS item
), cleaned AS (
  SELECT id, jsonb_agg(to_jsonb(txt)) AS new_locations FROM flattened GROUP BY id
)
UPDATE public.campaigns c SET locations = cleaned.new_locations FROM cleaned WHERE c.id = cleaned.id;
