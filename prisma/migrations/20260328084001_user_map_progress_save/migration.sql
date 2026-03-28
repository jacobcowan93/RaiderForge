-- CreateTable
CREATE TABLE "UserMapProgressSave" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "payload" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserMapProgressSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
