-- AlterTable
ALTER TABLE "time_off_requests" ADD COLUMN "halfDays" JSONB NOT NULL DEFAULT '[]';
