CREATE TYPE "ProjectActivityType" AS ENUM (
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_SUBMITTED',
  'PROJECT_STATUS_CHANGED',
  'PHASE_ADVANCED',
  'MILESTONE_CREATED',
  'MILESTONE_UPDATED',
  'TASK_CREATED',
  'TASK_UPDATED'
);

CREATE TABLE "ProjectActivity" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "actorId" TEXT,
  "type" "ProjectActivityType" NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectActivity_projectId_createdAt_idx" ON "ProjectActivity"("projectId", "createdAt");
CREATE INDEX "ProjectActivity_actorId_idx" ON "ProjectActivity"("actorId");

ALTER TABLE "ProjectActivity"
ADD CONSTRAINT "ProjectActivity_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectActivity"
ADD CONSTRAINT "ProjectActivity_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
