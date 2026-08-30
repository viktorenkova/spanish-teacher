import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/server/db/client";
import { learners } from "@/server/db/schema";
import { logError } from "@/server/observability/logger";

const renameProfileSchema = z.object({
  learnerId: z.uuid(),
  displayName: z.string().trim().min(1).max(80),
});

const deleteProfileSchema = z.object({
  learnerId: z.uuid(),
  confirmationDisplayName: z.string().min(1).max(80),
});

export async function PATCH(request: Request) {
  const parsed = renameProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid learner ID and name are required." }, { status: 400 });
  }

  try {
    const [learner] = await getDatabase()
      .update(learners)
      .set({ displayName: parsed.data.displayName, updatedAt: new Date() })
      .where(eq(learners.id, parsed.data.learnerId))
      .returning({ id: learners.id, displayName: learners.displayName });

    if (!learner) {
      return NextResponse.json({ error: "The learner profile was not found." }, { status: 404 });
    }

    return NextResponse.json({ learner });
  } catch (error) {
    logError("learner_profile_rename_failed", error, {
      method: "PATCH",
      route: "/api/learner/profile",
    });
    return NextResponse.json({ error: "The learner name could not be updated." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  const parsed = deleteProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid learner ID and exact confirmation name are required." },
      { status: 400 },
    );
  }

  try {
    const db = getDatabase();
    const [deleted] = await db
      .delete(learners)
      .where(and(
        eq(learners.id, parsed.data.learnerId),
        eq(learners.displayName, parsed.data.confirmationDisplayName),
      ))
      .returning({ id: learners.id });

    if (deleted) return NextResponse.json({ deleted: true });

    const [existing] = await db
      .select({ id: learners.id })
      .from(learners)
      .where(eq(learners.id, parsed.data.learnerId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "The learner profile was not found." }, { status: 404 });
    }

    return NextResponse.json(
      { error: "The confirmation name does not match. The profile was not deleted." },
      { status: 409 },
    );
  } catch (error) {
    logError("learner_profile_delete_failed", error, {
      method: "DELETE",
      route: "/api/learner/profile",
    });
    return NextResponse.json({ error: "The learner profile could not be deleted." }, { status: 503 });
  }
}
