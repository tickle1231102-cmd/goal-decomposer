-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "GoalScope" AS ENUM ('SHORT_TERM', 'MID_TERM', 'LONG_TERM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" "GoalScope" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YearlyPlan" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "YearlyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyPlan" (
    "id" TEXT NOT NULL,
    "yearlyPlanId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "theme" TEXT NOT NULL,

    CONSTRAINT "MonthlyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
    "id" TEXT NOT NULL,
    "monthlyPlanId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "focusGoal" TEXT NOT NULL,

    CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTask" (
    "id" TEXT NOT NULL,
    "weeklyPlanId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "estimatedMin" INTEGER NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',

    CONSTRAINT "DailyTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_scope_idx" ON "Goal"("scope");

-- CreateIndex
CREATE INDEX "YearlyPlan_goalId_idx" ON "YearlyPlan"("goalId");

-- CreateIndex
CREATE INDEX "MonthlyPlan_yearlyPlanId_idx" ON "MonthlyPlan"("yearlyPlanId");

-- CreateIndex
CREATE INDEX "WeeklyPlan_monthlyPlanId_idx" ON "WeeklyPlan"("monthlyPlanId");

-- CreateIndex
CREATE INDEX "DailyTask_weeklyPlanId_idx" ON "DailyTask"("weeklyPlanId");

-- CreateIndex
CREATE INDEX "DailyTask_date_idx" ON "DailyTask"("date");

-- CreateIndex
CREATE INDEX "DailyTask_status_idx" ON "DailyTask"("status");

-- AddForeignKey
ALTER TABLE "YearlyPlan" ADD CONSTRAINT "YearlyPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyPlan" ADD CONSTRAINT "MonthlyPlan_yearlyPlanId_fkey" FOREIGN KEY ("yearlyPlanId") REFERENCES "YearlyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_monthlyPlanId_fkey" FOREIGN KEY ("monthlyPlanId") REFERENCES "MonthlyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTask" ADD CONSTRAINT "DailyTask_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

