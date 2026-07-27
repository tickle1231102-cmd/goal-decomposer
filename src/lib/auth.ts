import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireCurrentUser() {
  return getCurrentUser();
}

export async function goalBelongsToUser(goalId: string, userId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  });

  return goal !== null;
}

export async function taskBelongsToUser(taskId: string, userId: string) {
  const task = await prisma.dailyTask.findFirst({
    where: {
      id: taskId,
      weeklyPlan: {
        monthlyPlan: {
          yearlyPlan: {
            goal: {
              userId,
            },
          },
        },
      },
    },
    select: { id: true },
  });

  return task !== null;
}
