import "server-only";
import { and, desc, eq } from "drizzle-orm";
import {
  deriveLessonSessionStatus,
  type LessonSessionStatus,
} from "@/domain/lesson-session";
import { getLessonDefinition, type LessonKey } from "@/domain/lesson";
import { getDatabase } from "@/server/db/client";
import { exerciseAttempts, lessonPlans, lessonSessions } from "@/server/db/schema";
import { mapSavedLessonPlan } from "@/server/lesson-planner/service";

function serialiseSession(
  session: typeof lessonSessions.$inferSelect,
  plan: typeof lessonPlans.$inferSelect,
) {
  return {
    id: session.id,
    status: session.status as LessonSessionStatus,
    startedAt: session.startedAt.toISOString(),
    lastActivityAt: session.lastActivityAt.toISOString(),
    completedAt: session.completedAt?.toISOString(),
    plan: mapSavedLessonPlan(plan),
  };
}

export async function loadActiveLessonSession(learnerId: string) {
  const [joined] = await getDatabase()
    .select()
    .from(lessonSessions)
    .innerJoin(lessonPlans, eq(lessonSessions.lessonPlanId, lessonPlans.id))
    .where(
      and(
        eq(lessonSessions.learnerId, learnerId),
        eq(lessonSessions.status, "active"),
      ),
    )
    .orderBy(desc(lessonSessions.lastActivityAt))
    .limit(1);

  return joined
    ? serialiseSession(joined.lesson_sessions, joined.lesson_plans)
    : null;
}

export async function startLessonSession(input: {
  learnerId: string;
  planId: string;
  now?: Date;
}) {
  const db = getDatabase();
  const now = input.now ?? new Date();
  const result = await db.transaction(async (transaction) => {
    const [plan] = await transaction
      .select()
      .from(lessonPlans)
      .where(
        and(
          eq(lessonPlans.id, input.planId),
          eq(lessonPlans.learnerId, input.learnerId),
        ),
      )
      .limit(1);
    if (!plan || plan.status === "completed") throw new Error("LESSON_PLAN_UNAVAILABLE");

    const [existingForPlan] = await transaction
      .select()
      .from(lessonSessions)
      .where(
        and(
          eq(lessonSessions.learnerId, input.learnerId),
          eq(lessonSessions.lessonPlanId, input.planId),
        ),
      )
      .limit(1);
    if (existingForPlan?.status === "active") return { session: existingForPlan, plan };
    if (existingForPlan) throw new Error("LESSON_PLAN_UNAVAILABLE");

    const [otherActive] = await transaction
      .select({ id: lessonSessions.id })
      .from(lessonSessions)
      .where(
        and(
          eq(lessonSessions.learnerId, input.learnerId),
          eq(lessonSessions.status, "active"),
        ),
      )
      .limit(1);
    if (otherActive) throw new Error("ACTIVE_LESSON_EXISTS");

    const [session] = await transaction
      .insert(lessonSessions)
      .values({
        learnerId: input.learnerId,
        lessonPlanId: plan.id,
        lessonKey: plan.plan.lessonKey ?? "introductions-v1",
        status: "active",
        startedAt: now,
        lastActivityAt: now,
      })
      .returning();
    await transaction
      .update(lessonPlans)
      .set({ status: "active" })
      .where(eq(lessonPlans.id, plan.id));
    return { session, plan: { ...plan, status: "active" } };
  });

  return serialiseSession(result.session, result.plan);
}

export async function abandonLessonSession(input: {
  learnerId: string;
  sessionId: string;
  now?: Date;
}) {
  const db = getDatabase();
  const now = input.now ?? new Date();
  const result = await db.transaction(async (transaction) => {
    const [joined] = await transaction
      .select()
      .from(lessonSessions)
      .innerJoin(lessonPlans, eq(lessonSessions.lessonPlanId, lessonPlans.id))
      .where(
        and(
          eq(lessonSessions.id, input.sessionId),
          eq(lessonSessions.learnerId, input.learnerId),
        ),
      )
      .limit(1);
    if (!joined) throw new Error("UNKNOWN_LESSON_SESSION");
    if (joined.lesson_sessions.status === "abandoned") return joined;
    if (joined.lesson_sessions.status !== "active") throw new Error("LESSON_SESSION_NOT_ACTIVE");

    const [session] = await transaction
      .update(lessonSessions)
      .set({
        status: "abandoned",
        lastActivityAt: now,
      })
      .where(
        and(
          eq(lessonSessions.id, input.sessionId),
          eq(lessonSessions.learnerId, input.learnerId),
          eq(lessonSessions.status, "active"),
        ),
      )
      .returning();
    if (!session) throw new Error("LESSON_SESSION_NOT_ACTIVE");

    await transaction
      .update(lessonPlans)
      .set({ status: "abandoned" })
      .where(eq(lessonPlans.id, joined.lesson_plans.id));

    return {
      lesson_sessions: session,
      lesson_plans: { ...joined.lesson_plans, status: "abandoned" },
    };
  });

  return serialiseSession(result.lesson_sessions, result.lesson_plans);
}

export async function updateLessonSessionAfterAttempt(input: {
  learnerId: string;
  sessionId: string;
  now: Date;
}) {
  const db = getDatabase();
  const [joined] = await db
    .select()
    .from(lessonSessions)
    .innerJoin(lessonPlans, eq(lessonSessions.lessonPlanId, lessonPlans.id))
    .where(
      and(
        eq(lessonSessions.id, input.sessionId),
        eq(lessonSessions.learnerId, input.learnerId),
      ),
    )
    .limit(1);
  if (!joined) throw new Error("UNKNOWN_LESSON_SESSION");
  if (joined.lesson_sessions.status !== "active") {
    return joined.lesson_sessions.status as Exclude<LessonSessionStatus, "active">;
  }

  const lessonKey = (joined.lesson_plans.plan.lessonKey ?? "introductions-v1") as LessonKey;
  const lesson = getLessonDefinition(lessonKey);
  if (!lesson) throw new Error("UNKNOWN_LESSON_SESSION");
  const expectedExerciseIds = [
    ...(joined.lesson_plans.plan.reviewExercises ?? []).map(({ id }) => id),
    ...lesson.exercises.map(({ id }) => id),
  ];
  const completedAttempts = await db
    .select({ exerciseId: exerciseAttempts.exerciseId })
    .from(exerciseAttempts)
    .where(
      and(
        eq(exerciseAttempts.lessonSessionId, input.sessionId),
        eq(exerciseAttempts.correct, true),
      ),
    );
  const status = deriveLessonSessionStatus({
    expectedExerciseIds,
    completedExerciseIds: completedAttempts.map(({ exerciseId }) => exerciseId),
  });

  await db.transaction(async (transaction) => {
    const [updatedSession] = await transaction
      .update(lessonSessions)
      .set({
        status,
        lastActivityAt: input.now,
        completedAt: status === "completed" ? input.now : null,
      })
      .where(
        and(
          eq(lessonSessions.id, input.sessionId),
          eq(lessonSessions.learnerId, input.learnerId),
          eq(lessonSessions.status, "active"),
        ),
      )
      .returning({ id: lessonSessions.id });
    if (!updatedSession) return;
    await transaction
      .update(lessonPlans)
      .set({ status })
      .where(eq(lessonPlans.id, joined.lesson_plans.id));
  });

  return status;
}
