-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'RATING', 'TEXT', 'RANKING');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE';

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN "textValue" TEXT,
ADD COLUMN "ratingValue" INTEGER,
ADD COLUMN "rankingValue" JSONB;

ALTER TABLE "Answer" DROP CONSTRAINT "Answer_optionId_fkey";
ALTER TABLE "Answer" ALTER COLUMN "optionId" DROP NOT NULL;
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
