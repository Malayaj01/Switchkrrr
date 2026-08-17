-- Database-backed failed-auth rate limiting. Keys are a stable hash-free
-- combination of client address and the submitted account identity.
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthAttempt_key_action_createdAt_idx" ON "AuthAttempt"("key", "action", "createdAt");
CREATE INDEX "AuthAttempt_createdAt_idx" ON "AuthAttempt"("createdAt");
ALTER TABLE "AuthAttempt" ADD CONSTRAINT "AuthAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
