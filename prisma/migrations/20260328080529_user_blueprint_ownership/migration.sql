-- CreateTable
CREATE TABLE "UserBlueprintOwnership" (
    "userId" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "state" TEXT NOT NULL,

    PRIMARY KEY ("userId", "blueprintId"),
    CONSTRAINT "UserBlueprintOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserBlueprintOwnership_userId_idx" ON "UserBlueprintOwnership"("userId");
