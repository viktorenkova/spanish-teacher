import { describe, expect, it } from "vitest";
import {
  createEmptyProgress,
  cafeOrderingLesson,
  dailyRoutineLesson,
  getExerciseCoaching,
  introductionLesson,
  lessonCatalog,
  recordAnswer,
} from "./lesson";
import { getListeningClip } from "./listening";

describe("lesson progress", () => {
  it("records attempts without completing an incorrect answer", () => {
    const progress = recordAnswer(createEmptyProgress(), introductionLesson[0], "sorry");

    expect(progress.attempts).toBe(1);
    expect(progress.correctAnswers).toBe(0);
    expect(progress.completedExerciseIds).toEqual([]);
  });

  it("awards an exercise only once", () => {
    const exercise = introductionLesson[0];
    const first = recordAnswer(createEmptyProgress(), exercise, exercise.correctOptionId);
    const repeated = recordAnswer(first, exercise, exercise.correctOptionId);

    expect(repeated.attempts).toBe(2);
    expect(repeated.correctAnswers).toBe(1);
    expect(repeated.completedExerciseIds).toEqual([exercise.id]);
  });

  it("keeps listening and speaking in the daily-routines lesson", () => {
    expect(dailyRoutineLesson.some(({ modality }) => modality === "listening")).toBe(true);
    expect(dailyRoutineLesson.some(({ modality }) => modality === "production")).toBe(true);
  });

  it("keeps listening and speaking in the cafe-ordering lesson", () => {
    expect(cafeOrderingLesson.some(({ modality }) => modality === "listening")).toBe(true);
    expect(cafeOrderingLesson.some(({ modality }) => modality === "production")).toBe(true);
  });

  it("keeps listening, speaking, provenance, and valid audio references in every lesson", () => {
    for (const lesson of Object.values(lessonCatalog)) {
      expect(lesson.exercises.some(({ modality }) => modality === "listening")).toBe(true);
      expect(lesson.exercises.some(({ modality }) => modality === "production")).toBe(true);

      for (const exercise of lesson.exercises) {
        expect(exercise.learningItem.license).toBe("Project-authored");
        expect(exercise.learningItem.attribution).toBe("Spanish Coach");
        expect(exercise.learningItem.qaStatus).toBe("reviewed");
        if (exercise.modality === "listening") {
          expect(exercise.listeningClipId).toBeTruthy();
          expect(getListeningClip(exercise.listeningClipId ?? "")).toBeTruthy();
        }
      }
    }
  });

  it("provides deterministic coaching for non-speaking exercises", () => {
    for (const lesson of Object.values(lessonCatalog)) {
      for (const exercise of lesson.exercises.filter(({ modality }) => modality !== "production")) {
        const coaching = getExerciseCoaching(exercise);

        expect(coaching).toBeDefined();
        expect(coaching?.targetPhrase).toBe(exercise.learningItem.targetText);
        expect(coaching?.explanation).toContain(exercise.learningItem.supportText);
        expect(coaching?.transferPrompt.length).toBeGreaterThan(20);
      }
    }
  });

  it("leaves speaking coaching to the deterministic teacher provider", () => {
    const speakingExercise = introductionLesson.find(({ modality }) => modality === "production");

    expect(speakingExercise).toBeDefined();
    expect(speakingExercise && getExerciseCoaching(speakingExercise)).toBeUndefined();
  });
});
