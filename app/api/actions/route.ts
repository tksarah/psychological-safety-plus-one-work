import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { plusActions } from "../../../db/schema";

const SESSION_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/;

function message(error: unknown) {
  const value = error instanceof Error ? error.message : "Unexpected error";
  if (value.includes("no such table")) return "投稿データベースを準備中です。少し待ってからお試しください。";
  return "処理に失敗しました。時間をおいてもう一度お試しください。";
}

export async function GET(request: Request) {
  try {
    const sessionCode = new URL(request.url).searchParams.get("session") ?? "";
    if (!SESSION_PATTERN.test(sessionCode)) return Response.json({ error: "セッションコードが正しくありません。" }, { status: 400 });
    const rows = await getDb().select().from(plusActions).where(eq(plusActions.sessionCode, sessionCode)).orderBy(desc(plusActions.createdAt), desc(plusActions.id)).limit(100);
    return Response.json({ actions: rows });
  } catch (error) {
    return Response.json({ error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { sessionCode?: string; itemNumber?: number; actionText?: string };
    const sessionCode = payload.sessionCode?.trim() ?? "";
    const actionText = payload.actionText?.trim() ?? "";
    const itemNumber = Number(payload.itemNumber);
    if (!SESSION_PATTERN.test(sessionCode)) return Response.json({ error: "セッションコードが正しくありません。" }, { status: 400 });
    if (!Number.isInteger(itemNumber) || itemNumber < 1 || itemNumber > 7) return Response.json({ error: "項目を一つ選んでください。" }, { status: 400 });
    if (actionText.length < 4 || actionText.length > 160) return Response.json({ error: "プラス1行動は4〜160文字で入力してください。" }, { status: 400 });
    const [created] = await getDb().insert(plusActions).values({ sessionCode, itemNumber, actionText }).returning();
    return Response.json({ action: created }, { status: 201 });
  } catch (error) {
    return Response.json({ error: message(error) }, { status: 500 });
  }
}
