-- Rows created before "sortOrder" existed were backfilled to the column's
-- default of 0, so every pre-existing row for a given owner shares the same
-- value. Renumber per owner (preserving current relative order) so up/down
-- reordering has distinct values to swap between.
UPDATE "Todo" AS t
SET "sortOrder" = ranked.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "ownerId" ORDER BY "sortOrder", "createdAt") - 1 AS rn
  FROM "Todo"
) AS ranked
WHERE t."id" = ranked."id";
