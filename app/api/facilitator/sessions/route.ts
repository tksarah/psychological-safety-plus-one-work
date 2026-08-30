import { count, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { plusActions, workshopSessions } from "../../../../db/schema";
import { instructorUnauthorized, isInstructor } from "@/lib/instructor-auth";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("");
}

export async function GET(request: Request) {
  if (!isInstructor(request.headers)) return instructorUnauthorized(request.headers);

  const sessions = await getDb()
    .select({
      id: workshopSessions.id,
      code: workshopSessions.code,
      title: workshopSessions.title,
      status: workshopSessions.status,
      createdAt: workshopSessions.createdAt,
      actionCount: count(plusActions.id),
    })
    .from(workshopSessions)
    .leftJoin(plusActions, eq(plusActions.sessionCode, workshopSessions.code))
    .groupBy(workshopSessions.id)
    .orderBy(desc(workshopSessions.createdAt), desc(workshopSessions.id));

  return Response.json({ sessions });
}

export async function POST(request: Request) {
  if (!isInstructor(request.headers)) return instructorUnauthorized(request.headers);

  const payload = (await request.json()) as { title?: string };
  const title = payload.title?.trim() ?? "";
  if (title.length < 1 || title.length > 60) {
    return Response.json({ error: "開催名を1〜60文字で入力してください。" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = makeCode();
    try {
      const [session] = await getDb()
        .insert(workshopSessions)
        .values({ code, title })
        .returning();
      return Response.json({ session }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("UNIQUE")) throw error;
    }
  }

  return Response.json({ error: "コードを発行できませんでした。もう一度お試しください。" }, { status: 500 });
}
