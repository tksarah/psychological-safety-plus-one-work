import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { plusActions, workshopSessions } from "../../../db/schema";

const SESSION_PATTERN = /^[A-Z2-9]{6}$/;

function message(error: unknown) {
  const value = error instanceof Error ? error.message : "Unexpected error";
  if (value.includes("no such table")) return "投稿データベースを準備中です。少し待ってからお試しください。";
  return "処理に失敗しました。時間をおいてもう一度お試しください。";
}

export async function GET(request: Request) {
  try {
    const sessionCode = (new URL(request.url).searchParams.get("session") ?? "").toUpperCase();
    if (!SESSION_PATTERN.test(sessionCode)) return Response.json({ error: "セッションコードが正しくありません。" }, { status: 400 });
    const db = getDb();
    const [session] = await db.select({ id: workshopSessions.id }).from(workshopSessions).where(and(eq(workshopSessions.code, sessionCode), eq(workshopSessions.status, "active"))).limit(1);
    if (!session) return Response.json({ error: "この開催コードは存在しないか、現在利用できません。" }, { status: 404 });
    const rows = await db.select().from(plusActions).where(eq(plusActions.sessionCode, sessionCode)).orderBy(desc(plusActions.createdAt), desc(plusActions.id)).limit(100);
    return Response.json({ actions: rows });
  } catch (error) {
    return Response.json({ error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { sessionCode?: string; itemNumber?: number; actionText?: string };
    const sessionCode = payload.sessionCode?.trim().toUpperCase() ?? "";
    const actionText = payload.actionText?.trim() ?? "";
    const itemNumber = Number(payload.itemNumber);
    if (!SESSION_PATTERN.test(sessionCode)) return Response.json({ error: "セッションコードが正しくありません。" }, { status: 400 });
    if (!Number.isInteger(itemNumber) || itemNumber < 1 || itemNumber > 7) return Response.json({ error: "項目を一つ選んでください。" }, { status: 400 });
    if (actionText.length < 4 || actionText.length > 160) return Response.json({ error: "プラス1行動は4〜160文字で入力してください。" }, { status: 400 });
    const db = getDb();
    const [session] = await db.select({ id: workshopSessions.id }).from(workshopSessions).where(and(eq(workshopSessions.code, sessionCode), eq(workshopSessions.status, "active"))).limit(1);
    if (!session) return Response.json({ error: "この開催コードは存在しないか、現在利用できません。" }, { status: 404 });
    const [created] = await db.insert(plusActions).values({ sessionCode, itemNumber, actionText }).returning();
    return Response.json({ action: created }, { status: 201 });
  } catch (error) {
    return Response.json({ error: message(error) }, { status: 500 });
  }
}
