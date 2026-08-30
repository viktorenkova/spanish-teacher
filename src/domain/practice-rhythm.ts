export type PracticeRhythm = {
  activeDaysLast7: number;
  activeDaysLast30: number;
  currentRunDays: number;
  practisedToday: boolean;
  lastPracticeAt?: string;
  guidance: string;
};

function localDateKey(date: Date, timezoneOffsetMinutes: number) {
  return new Date(date.getTime() - timezoneOffsetMinutes * 60_000)
    .toISOString()
    .slice(0, 10);
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildPracticeRhythm(input: {
  completedAt: Date[];
  now: Date;
  timezoneOffsetMinutes: number;
}): PracticeRhythm {
  const activeDates = new Set(
    input.completedAt.map((date) => localDateKey(date, input.timezoneOffsetMinutes)),
  );
  const today = localDateKey(input.now, input.timezoneOffsetMinutes);
  const yesterday = shiftDateKey(today, -1);
  const practisedToday = activeDates.has(today);

  let cursor = practisedToday ? today : activeDates.has(yesterday) ? yesterday : undefined;
  let currentRunDays = 0;
  while (cursor && activeDates.has(cursor)) {
    currentRunDays += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const countActiveDays = (days: number) => {
    const firstDate = shiftDateKey(today, -(days - 1));
    return [...activeDates].filter((date) => date >= firstDate && date <= today).length;
  };
  const lastPracticeAt = input.completedAt.length > 0
    ? new Date(Math.max(...input.completedAt.map((date) => date.getTime()))).toISOString()
    : undefined;
  const guidance = practisedToday
    ? "You have practised today. Come back tomorrow when it suits you."
    : currentRunDays > 0
      ? "One short lesson today would continue your learning rhythm."
      : lastPracticeAt
        ? "Welcome back. One short lesson is enough to start a new rhythm."
        : "Your learning rhythm can start with one short lesson.";

  return {
    activeDaysLast7: countActiveDays(7),
    activeDaysLast30: countActiveDays(30),
    currentRunDays,
    practisedToday,
    lastPracticeAt,
    guidance,
  };
}
