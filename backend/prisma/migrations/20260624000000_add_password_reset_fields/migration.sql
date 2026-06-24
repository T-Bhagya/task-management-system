-- Add password reset fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password_last_changed" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "reset_code" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "reset_code_expires" TIMESTAMP(3);

-- Create RealtimeNotification table
CREATE TABLE IF NOT EXISTS "realtime_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "realtime_notifications_pkey" PRIMARY KEY ("id")
);
