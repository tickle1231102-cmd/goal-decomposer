import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GoalScope, Prisma } from "@prisma/client";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import {
  ActionPlanOutputSchema,
  GoalInputSchema,
  type ActionPlanOutput,
  type GoalInput,
} from "@/lib/schematic";
import {
  getWeekAssignment,
  isExcludedDate,
  parseDateOnly,
  WEEKDAY_LABELS_EN,
  weekClassificationPromptLines,
  weeklyPlanKey,
} from "@/lib/week-utils";

const SCOPE_LABELS: Record<GoalInput["scope"], string> = {
  SHORT_TERM: "1~3 months",
  MID_TERM: "3~6 months",
  LONG_TERM: "1 year or more",
};


function formatExcludedWeekdays(weekdays: number[]): string {
  if (weekdays.length === 0) {
    return "None";
  }
  return weekdays
    .slice()
    .sort((a, b) => a - b)
    .map((day) => `${WEEKDAY_LABELS_EN[day]} (${day})`)
    .join(", ");
}

function formatExcludedDates(dates: string[]): string {
  if (dates.length === 0) {
    return "None";
  }
  return dates.slice().sort().join(", ");
}

function buildRestDayPromptLines(input: GoalInput): string[] {
  const excludedWeekdays = input.excludedWeekdays ?? [];
  const excludedDates = input.excludedDates ?? [];

  if (excludedWeekdays.length === 0 && excludedDates.length === 0) {
    return [];
  }

  return [
    "",
    "Rest day / exclusion rules (mandatory):",
    `- Excluded weekdays (getDay 0=Sun … 6=Sat): ${formatExcludedWeekdays(excludedWeekdays)}`,
    `- Excluded specific dates: ${formatExcludedDates(excludedDates)}`,
    "- Do NOT assign any dailyTasks on excluded weekdays or excluded dates.",
    "- Rest days are intentional gaps — leave them empty; do not backfill tasks onto adjacent days.",
    "- Weekly focus goals may still mention rest or recovery for excluded days when relevant.",
  ];
}

function filterExcludedDailyTasks(
  actionPlan: ActionPlanOutput,
  input: GoalInput,
): ActionPlanOutput {
  const excludedWeekdays = input.excludedWeekdays ?? [];
  const excludedDates = input.excludedDates ?? [];

  if (excludedWeekdays.length === 0 && excludedDates.length === 0) {
    return actionPlan;
  }

  const beforeCount = actionPlan.dailyTasks.length;
  const dailyTasks = actionPlan.dailyTasks.filter(
    (task) => !isExcludedDate(task.date, excludedWeekdays, excludedDates),
  );
  const removedCount = beforeCount - dailyTasks.length;

  if (removedCount > 0) {
    console.warn(
      `[POST /api/plan/generate] Stripped ${removedCount} dailyTask(s) on excluded dates`,
    );
  }

  return { ...actionPlan, dailyTasks };
}

function buildActionPlanPrompt(input: GoalInput): string {
  return [
    "You are an expert goal decomposition coach.",
    "Break the user's goal into a realistic, actionable hierarchy: yearly summaries, monthly themes, weekly focus goals, and daily tasks.",
    "",
    "Goal details:",
    `- Title: ${input.title}`,
    `- Description: ${input.description ?? "None provided"}`,
    `- Scope: ${input.scope} (${SCOPE_LABELS[input.scope]})`,
    `- Start date: ${input.startDate}`,
    `- End date: ${input.endDate}`,
    ...buildRestDayPromptLines(input),
    "",
    "Daily task strategy (maximize execution):",
    "- Break work into the smallest actionable units — each dailyTask should be one clear action completable in a single sitting.",
    "- Prefer multiple small tasks per day over one vague large task.",
    "- Each task content must start with a strong action verb and include a concrete deliverable (what 'done' looks like).",
    "- Keep estimatedMin between 10 and 45 minutes per task; split anything longer into separate tasks.",
    "- Avoid abstract phrasing (e.g. 'study English'); use specific steps (e.g. 'Complete 20 TOEIC listening questions and review 5 wrong answers').",
    "- Include setup steps when they reduce friction (e.g. 'Open Anki deck and review 30 cards').",
    "- Balance intensity across active days; respect excluded rest days.",
    "",
    "Structural requirements:",
    "- Cover the full period from startDate through endDate.",
    "- Assign dailyTasks only on dates within [startDate, endDate] (YYYY-MM-DD).",
    "- Distribute daily tasks across active (non-excluded) days — gaps on rest days are expected and correct.",
    ...weekClassificationPromptLines(),
    "- Keep daily task content concrete and executable within estimatedMin minutes.",
    "- Align monthly themes and weekly focus goals with the yearly summaries.",
    "- Write summary as a concise overview of the entire action plan.",
  ].join("\n");
}

function resolveWeeklyPlanId(
  weeklyPlanIds: Map<string, string>,
  taskDate: Date,
): string {
  const { year, month, weekNumber } = getWeekAssignment(taskDate);

  let weeklyPlanId = weeklyPlanIds.get(
    weeklyPlanKey(year, month, weekNumber),
  );

  if (!weeklyPlanId) {
    const fallbackKey = [...weeklyPlanIds.keys()].find((key) =>
      key.startsWith(`${year}-${month}-`),
    );
    weeklyPlanId = fallbackKey ? weeklyPlanIds.get(fallbackKey) : undefined;
  }

  if (!weeklyPlanId) {
    throw new Error(
      `No weekly plan found for daily task on ${taskDate.toISOString().slice(0, 10)}`,
    );
  }

  return weeklyPlanId;
}

async function persistActionPlan(
  input: GoalInput,
  actionPlan: ActionPlanOutput,
) {
  return prisma.$transaction(
    async (tx) => {
      const goal = await tx.goal.create({
        data: {
          title: input.title,
          description: input.description ?? "",
          scope: input.scope as GoalScope,
          startDate: parseDateOnly(input.startDate),
          endDate: parseDateOnly(input.endDate),
        },
      });

      const yearlyPlanIds = new Map<number, string>();

      for (const yearly of actionPlan.yearlySummary) {
        const yearlyPlan = await tx.yearlyPlan.create({
          data: {
            goalId: goal.id,
            year: yearly.year,
            summary: yearly.summary,
          },
        });
        yearlyPlanIds.set(yearly.year, yearlyPlan.id);
      }

      const monthlyPlanIds = new Map<string, string>();

      for (const monthly of actionPlan.monthlyBreakdown) {
        const yearlyPlanId = yearlyPlanIds.get(monthly.year);
        if (!yearlyPlanId) {
          throw new Error(`Missing yearly plan for year ${monthly.year}`);
        }

        const monthlyPlan = await tx.monthlyPlan.create({
          data: {
            yearlyPlanId,
            month: monthly.month,
            theme: monthly.theme,
          },
        });
        monthlyPlanIds.set(`${monthly.year}-${monthly.month}`, monthlyPlan.id);
      }

      const weeklyPlanIds = new Map<string, string>();

      for (const weekly of actionPlan.weeklyBreakdown) {
        const monthlyPlanId = monthlyPlanIds.get(
          `${weekly.year}-${weekly.month}`,
        );
        if (!monthlyPlanId) {
          throw new Error(
            `Missing monthly plan for ${weekly.year}-${weekly.month}`,
          );
        }

        const weeklyPlan = await tx.weeklyPlan.create({
          data: {
            monthlyPlanId,
            weekNumber: weekly.weekNumber,
            focusGoal: weekly.focusGoal,
          },
        });
        weeklyPlanIds.set(
          weeklyPlanKey(weekly.year, weekly.month, weekly.weekNumber),
          weeklyPlan.id,
        );
      }

      const dailyTaskRecords = actionPlan.dailyTasks.map((task) => {
        const taskDate = parseDateOnly(task.date);
        const weeklyPlanId = resolveWeeklyPlanId(weeklyPlanIds, taskDate);

        return {
          weeklyPlanId,
          date: taskDate,
          content: task.content,
          estimatedMin: task.estimatedMin,
        };
      });

      if (dailyTaskRecords.length > 0) {
        await tx.dailyTask.createMany({ data: dailyTaskRecords });
      }

      return tx.goal.findUniqueOrThrow({
        where: { id: goal.id },
        include: {
          yearlyPlans: {
            orderBy: { year: "asc" },
            include: {
              monthlyPlans: {
                orderBy: { month: "asc" },
                include: {
                  weeklyPlans: {
                    orderBy: { weekNumber: "asc" },
                    include: {
                      dailyTasks: {
                        orderBy: { date: "asc" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    },
    {
      maxWait: 10_000,
      timeout: 60_000,
    },
  );
}

function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json(
    {
      error: {
        message,
        ...(code ? { code } : {}),
      },
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const geminiApiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return jsonError(
        "GOOGLE_GENERATIVE_AI_API_KEY (or GEMINI_API_KEY) is not configured on the server.",
        500,
        "MISSING_GEMINI_API_KEY",
      );
    }

    const google = createGoogleGenerativeAI({ apiKey: geminiApiKey });

    const body: unknown = await request.json();
    const input = GoalInputSchema.parse(body);

    const geminiModel = process.env.GEMINI_MODEL ?? "gemini-3.5-flash";

    const { object: rawActionPlan } = await generateObject({
      model: google(geminiModel),
      schema: ActionPlanOutputSchema,
      schemaName: "ActionPlanOutput",
      schemaDescription:
        "Hierarchical action plan with yearly, monthly, weekly, and daily breakdown",
      prompt: buildActionPlanPrompt(input),
    });

    const actionPlan = filterExcludedDailyTasks(rawActionPlan, input);

    const goal = await persistActionPlan(input, actionPlan);

    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            message: "Invalid request payload",
            code: "VALIDATION_ERROR",
            details: error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      console.error("[POST /api/plan/generate] database error:", error);
      return jsonError("Database operation failed.", 500, "DATABASE_ERROR");
    }

    console.error("[POST /api/plan/generate]", error);

    return jsonError(
      error instanceof Error ? error.message : "Failed to generate action plan.",
      500,
      "INTERNAL_ERROR",
    );
  }
}
