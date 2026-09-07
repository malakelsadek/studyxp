-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "allowBackgroundChangeByMembers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowNameChangeByMembers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creatorId" TEXT;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data fix: Main Lobby belongs to mika and is open (no password)
UPDATE "Room"
SET "creatorId" = (SELECT "id" FROM "User" WHERE "email" = 'mika07@gmail.com'),
    "passwordHash" = NULL
WHERE "id" = 'lobby';
