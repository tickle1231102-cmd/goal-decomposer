import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const goalScopeSchema = z.enum(["SHORT_TERM", "MID_TERM", "LONG_TERM"]);

/** Validates user input before sending to the LLM pipeline. */
export const GoalInputSchema = z
  .object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
    scope: goalScopeSchema,
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"],
  });

/** Validates structured LLM output for the action plan decomposition. */
export const ActionPlanOutputSchema = z.object({
  summary: z.string(),
  yearlySummary: z.array(
    z.object({
      year: z.number().int(),
      summary: z.string(),
    }),
  ),
  monthlyBreakdown: z.array(
    z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      theme: z.string(),
    }),
  ),
  weeklyBreakdown: z.array(
    z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      weekNumber: z.number().int().min(1),
      focusGoal: z.string(),
    }),
  ),
  dailyTasks: z.array(
    z.object({
      date: dateStringSchema,
      content: z.string(),
      estimatedMin: z.number().int().positive(),
    }),
  ),
});

export type GoalInput = z.infer<typeof GoalInputSchema>;
export type ActionPlanOutput = z.infer<typeof ActionPlanOutputSchema>;
export type GoalScope = z.infer<typeof goalScopeSchema>;

export { dateStringSchema, goalScopeSchema };
