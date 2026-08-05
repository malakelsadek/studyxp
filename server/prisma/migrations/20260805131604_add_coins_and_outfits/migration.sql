-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownedCharacters" TEXT[] DEFAULT ARRAY['char-1', 'char-2']::TEXT[],
ADD COLUMN     "studyMsBanked" INTEGER NOT NULL DEFAULT 0;
