-- AlterTable
ALTER TABLE "Form" ADD COLUMN "commentCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing comment events
UPDATE "Form" f
SET "commentCount" = (
  SELECT COUNT(*)::INTEGER
  FROM "FormEvent" e
  WHERE e."formId" = f.id AND e.action = 'COMMENT'
);
