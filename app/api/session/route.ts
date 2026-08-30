import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { workshopSessions } from "../../../db/schema";

const SESSION_PATTERN = /^[A-Z2-9]{6}$/;

export async function GET(request: Request) {
  try {
    const code = (new URL(request.url).searchParams.get("code") ?? "").toUpperCase();
    if (!SESSION_PATTERN.test(code)) {
      return Response.json({ error: "開催コードが正しくありません。" }, { status: 400 });
    }

    const [session] = await getDb()
      .select({ code: workshopSessions.code, title: workshopSessions.title })
      .from(workshopSessions)
      .where(and(eq(workshopSessions.code, code), eq(workshopSessions.status, "active")))
      .limit(1);

    if (!session) {
      return Response.json({ error: "この開催コードは存在しないか、現在利用できません。" }, { status: 404 });
    }

    return Response.json({ session });
  } catch {
    return Response.json({ error: "開催情報を確認できませんでした。" }, { status: 500 });
  }
}
