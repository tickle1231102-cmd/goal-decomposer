export type WeekAssignment = {
  year: number;
  month: number;
  weekNumber: number;
};

/** Returns the Monday (UTC) that starts the Mon–Sun week containing `date`. */
export function getMondayOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - daysFromMonday);
  return monday;
}

/** All seven UTC dates (Mon–Sun) for the week starting on `monday`. */
export function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    return day;
  });
}

/**
 * Assigns a Mon–Sun week to the month with the most days in that week.
 * Tie-breaker (3–3 split): month containing the Monday.
 */
export function assignWeekToMonth(monday: Date): Pick<WeekAssignment, "year" | "month"> {
  const days = getWeekDays(monday);
  const counts = new Map<string, number>();

  for (const day of days) {
    const key = `${day.getUTCFullYear()}-${day.getUTCMonth() + 1}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const mondayKey = `${monday.getUTCFullYear()}-${monday.getUTCMonth() + 1}`;
  let bestKey = mondayKey;
  let bestCount = 0;

  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  const tiedKeys = [...counts.entries()]
    .filter(([, count]) => count === bestCount)
    .map(([key]) => key);

  const winnerKey = tiedKeys.length > 1 ? mondayKey : bestKey;
  const [year, month] = winnerKey.split("-").map(Number);
  return { year, month };
}

/**
 * 1-based index of this Mon–Sun week among all weeks assigned to `year`-`month`,
 * ordered by Monday date ascending.
 */
export function getWeekNumberInMonth(
  monday: Date,
  year: number,
  month: number,
): number {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month, 0));

  let cursor = getMondayOfWeek(firstOfMonth);
  cursor.setUTCDate(cursor.getUTCDate() - 7);

  const endCursor = getMondayOfWeek(lastOfMonth);
  endCursor.setUTCDate(endCursor.getUTCDate() + 7);

  const weeksInMonth: Date[] = [];

  while (cursor <= endCursor) {
    const assigned = assignWeekToMonth(cursor);
    if (assigned.year === year && assigned.month === month) {
      weeksInMonth.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }

  const index = weeksInMonth.findIndex(
    (weekMonday) => weekMonday.getTime() === monday.getTime(),
  );

  if (index >= 0) {
    return index + 1;
  }

  return weeksInMonth.length > 0 ? weeksInMonth.length : 1;
}

/** Resolves year, month, and weekNumber for any date using Mon–Sun week rules. */
export function getWeekAssignment(date: Date): WeekAssignment {
  const monday = getMondayOfWeek(date);
  const { year, month } = assignWeekToMonth(monday);
  const weekNumber = getWeekNumberInMonth(monday, year, month);
  return { year, month, weekNumber };
}

export function weeklyPlanKey(
  year: number,
  month: number,
  weekNumber: number,
): string {
  return `${year}-${month}-${weekNumber}`;
}

/** Instruction block for LLM prompts describing week classification rules. */
export function weekClassificationPromptLines(): string[] {
  return [
    "Week classification rules:",
    "- Weeks run Monday (start) through Sunday (end).",
    "- Each week belongs to the month that contains the majority of its 7 days (4+ days wins).",
    "- If days are split 3–3 between two months, assign the week to the month containing the Monday.",
    "- weekNumber is the 1-based index of Mon–Sun weeks assigned to that month, in chronological order (week 1 = the first such week).",
    "- For weeklyBreakdown, set year/month/weekNumber using these rules for each week's Monday.",
    "- Example: Mon 2024-01-29 through Sun 2024-02-04 has 4 days in February → assign to February.",
  ];
}
