-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Form_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormEvent_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Form_type_status_idx" ON "Form"("type", "status");

-- CreateIndex
CREATE INDEX "Form_createdById_createdAt_idx" ON "Form"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "FormEvent_formId_createdAt_idx" ON "FormEvent"("formId", "createdAt");

-- CreateIndex
CREATE INDEX "FormEvent_actorId_createdAt_idx" ON "FormEvent"("actorId", "createdAt");
