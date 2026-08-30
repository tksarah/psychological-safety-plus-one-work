import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { plusActions, workshopSessions } from "../../../../../db/schema";
import { instructorUnauthorized, isInstructor } from "@/lib/instructor-auth";

type RouteContext = { params: Promise<{ id: string }> };

async function findSession(id: number) {
  const [session] = await getDb()
    .select()
    .from(workshopSessions)
    .where(eq(workshopSessions.id, id))
    .limit(1);
  return session;
}

export async function GET(request: Request, context: RouteContext) {
  if (!isInstructor(request.headers)) return instructorUnauthorized(request.headers);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "開催情報が正しくありません。" }, { status: 400 });

  const session = await findSession(id);
  if (!session) return Response.json({ error: "開催が見つかりません。" }, { status: 404 });

  const actions = await getDb()
    .select()
    .from(plusActions)
    .where(eq(plusActions.sessionCode, session.code))
    .orderBy(asc(plusActions.createdAt), asc(plusActions.id));

  return Response.json({ session, actions });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isInstructor(request.headers)) return instructorUnauthorized(request.headers);
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: "開催情報が正しくありません。" }, { status: 400 });

  const session = await findSession(id);
  if (!session) return Response.json({ error: "開催が見つかりません。" }, { status: 404 });

  const db = getDb();
  await db.batch([
    db.delete(plusActions).where(eq(plusActions.sessionCode, session.code)),
    db.delete(workshopSessions).where(eq(workshopSessions.id, id)),
  ]);

  return Response.json({ deleted: true });
}
