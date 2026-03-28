-- CreateTable
CREATE TABLE "UserSkillTreeSave" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "payload" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSkillTreeSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
