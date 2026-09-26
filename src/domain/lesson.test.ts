import { describe, expect, it } from "vitest";
import {
  createEmptyProgress,
  cafeOrderingLesson,
  dailyRoutineLesson,
  getExerciseCoaching,
  getLessonRecallItems,
  introductionLesson,
  lessonCatalog,
  lessonTeachingSequenceIssues,
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

  it("teaches con and sin with optional audio before the cafe listening question", () => {
    const introductionIndex = cafeOrderingLesson.findIndex(({ id }) => id === "understand-cafe-without");
    const listeningIndex = cafeOrderingLesson.findIndex(({ id }) => id === "listen-cafe-order");
    const introduction = cafeOrderingLesson[introductionIndex];
    expect(introductionIndex).toBeGreaterThanOrEqual(0);
    expect(introductionIndex).toBeLessThan(listeningIndex);
    const teaching = lessonCatalog["cafe-ordering-v1"].teachingModules.find(({ beforeExerciseId }) =>
      beforeExerciseId === introduction.id);
    expect(teaching?.phrases).toEqual(expect.arrayContaining([
      { spanish: "Con leche", english: "With milk." },
      { spanish: "Sin azúcar", english: "Without sugar." },
    ]));
    expect(teaching?.example.spanish).toBe(introduction.learningItem.targetText);
    expect(introduction.options).toHaveLength(3);
    expect(getListeningClip(introduction.listeningClipId ?? "")?.text).toBe(introduction.learningItem.targetText);
  });

  it("introduces language and checks understanding before retrieval and production in every lesson", () => {
    for (const lesson of Object.values(lessonCatalog)) {
      expect(lessonTeachingSequenceIssues(lesson), lesson.key).toEqual([]);
      expect(lesson.teachingModules[0].beforeExerciseId).toBe(lesson.exercises[0].id);
    }
  });

  it("detects missing or late teaching before a recall exercise", () => {
    const lesson = lessonCatalog["introductions-v1"];
    expect(lessonTeachingSequenceIssues({ ...lesson, teachingModules: [] }))
      .toContain("A new lesson needs a teaching module.");
    expect(lessonTeachingSequenceIssues({
      ...lesson,
      teachingModules: [{ ...lesson.teachingModules[0], beforeExerciseId: "retrieve-name" }],
    })).toContain("Introduce useful language before the first exercise.");
  });

  it("rejects a module without a valid recognition check or useful content", () => {
    const lesson = lessonCatalog["introductions-v1"];
    const invalid = {
      ...lesson,
      teachingModules: [{
        ...lesson.teachingModules[0],
        beforeExerciseId: "retrieve-name",
        phrases: [{ spanish: "", english: "" }],
      }],
    };
    expect(lessonTeachingSequenceIssues(invalid)).toEqual(expect.arrayContaining([
      "Teaching module first-meeting needs a valid comprehension check.",
      "Teaching module first-meeting needs meaning and a contextual example.",
    ]));
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

  it("builds a short unique recall set for lesson completion", () => {
    const lesson = lessonCatalog["introductions-v1"];
    const recallItems = getLessonRecallItems(lesson, 3);

    expect(recallItems).toHaveLength(3);
    expect(new Set(recallItems.map(({ id }) => id)).size).toBe(3);
    expect(recallItems.every(({ targetText, supportText }) => targetText && supportText)).toBe(true);
  });
});
