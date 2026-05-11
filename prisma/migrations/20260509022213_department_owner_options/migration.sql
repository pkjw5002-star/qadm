-- CreateTable
CREATE TABLE "DepartmentOwnerOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentOwnerOption_label_key" ON "DepartmentOwnerOption"("label");
