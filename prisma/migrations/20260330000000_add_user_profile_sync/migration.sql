-- CreateTable
CREATE TABLE "UserProfileSync" (
    "userId"            TEXT NOT NULL,
    "source"            TEXT NOT NULL,
    "status"            TEXT NOT NULL,
    "importedAt"        TIMESTAMP(3) NOT NULL,
    "blueprintsCount"   INTEGER NOT NULL DEFAULT 0,
    "skillTreeImported" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage"      TEXT,

    CONSTRAINT "UserProfileSync_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "UserProfileSync" ADD CONSTRAINT "UserProfileSync_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
