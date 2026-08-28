export type LessonSessionStatus = "active" | "completed";

export function deriveLessonSessionStatus(input: {
  expectedExerciseIds: string[];
  completedExerciseIds: string[];
}): LessonSessionStatus {
  const completed = new Set(input.completedExerciseIds);
  return input.expectedExerciseIds.length > 0
    && input.expectedExerciseIds.every((exerciseId) => completed.has(exerciseId))
    ? "completed"
    : "active";
}
