-- CreateTable
CREATE TABLE "FormNumberSequence" (
    "id" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FormNumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Form_type_createdAt_idx" ON "Form"("type", "createdAt");

-- CreateIndex
CREATE INDEX "FormEvent_formId_action_createdAt_idx" ON "FormEvent"("formId", "action", "createdAt");
