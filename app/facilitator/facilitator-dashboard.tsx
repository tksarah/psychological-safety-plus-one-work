"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink, Eye, LoaderCircle, MonitorUp, Plus, RefreshCw, Timer, Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Session = {
  id: number;
  code: string;
  title: string;
  status: string;
  createdAt: string;
  actionCount: number;
};

type Action = {
  id: number;
  itemNumber: number;
  actionText: string;
  createdAt: string;
};

const timeline = [
  ["0:00–0:30", "目的とルール", "7項目の回答は保存せず、最後の行動だけ匿名で共有します。"],
  ["0:30–1:00", "チームを決める", "現在または過去のチームを一つ思い浮かべてもらいます。"],
  ["1:00–3:00", "7項目チェック", "Yes／No／わからないで各自回答してもらいます。"],
  ["3:00–4:00", "項目を一つ選ぶ", "気になる、または自分から動けそうな項目を選びます。"],
  ["4:00–6:00", "プラス1行動", "明日からできる小さな行動を具体的に書きます。"],
  ["6:00–7:00", "匿名投稿・共有", "一覧を画面共有し、2〜3件を紹介します。"],
];

export default function FacilitatorDashboard({ displayName }: { displayName: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [createdSession, setCreatedSession] = useState<Session | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState("");

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const participantUrl = useCallback((code: string) => `${origin}/?session=${encodeURIComponent(code)}`, [origin]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/facilitator/sessions", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "開催一覧を読み込めませんでした。");
      setSessions(body.sessions);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "開催一覧を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSessions(); }, [loadSessions]);

  async function createSession() {
    if (!title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/facilitator/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "開催を作成できませんでした。");
      const created = { ...body.session, actionCount: 0 } as Session;
      setCreatedSession(created);
      setSessions((current) => [created, ...current]);
      setTitle("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "開催を作成できませんでした。");
    } finally {
      setCreating(false);
    }
  }

  async function copyParticipantUrl(session: Session) {
    await navigator.clipboard.writeText(participantUrl(session.code));
    setCopiedCode(session.code);
    window.setTimeout(() => setCopiedCode(null), 1800);
  }

  async function viewResults(session: Session) {
    setSelectedSession(session);
    setActions([]);
    setError("");
    try {
      const response = await fetch(`/api/facilitator/sessions/${session.id}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "結果を読み込めませんでした。");
      setActions(body.actions);
    } catch (viewError) {
      setError(viewError instanceof Error ? viewError.message : "結果を読み込めませんでした。");
    }
  }

  async function deleteSession(session: Session) {
    setDeletingId(session.id);
    setError("");
    try {
      const response = await fetch(`/api/facilitator/sessions/${session.id}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "開催を削除できませんでした。");
      setSessions((current) => current.filter((item) => item.id !== session.id));
      if (selectedSession?.id === session.id) {
        setSelectedSession(null);
        setActions([]);
      }
      if (createdSession?.id === session.id) setCreatedSession(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "開催を削除できませんでした。");
    } finally {
      setDeletingId(null);
    }
  }

  const selectedTitle = useMemo(() => selectedSession ? `${selectedSession.title}（${selectedSession.code}）` : "", [selectedSession]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="rounded-3xl bg-[#173f37] px-6 py-8 text-white sm:px-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><Badge className="mb-4 bg-white/15 text-white">講師用</Badge><h1 className="text-3xl font-bold sm:text-4xl">開催管理・進行ガイド</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">開催を作成して参加URLを共有し、開催ごとの投稿を確認・削除できます。</p></div>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-xs text-white/75">{displayName}</div>
          </div>
        </header>

        <Card className="border-primary/30">
          <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Plus className="text-primary" />新しい開催を作成</CardTitle><CardDescription>開催名を入力して作成すると、参加用コードとURLが正式に発行されます。</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Input maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例：8月30日 午前の部" onKeyDown={(event) => event.key === "Enter" && void createSession()} /><Button disabled={creating || !title.trim()} onClick={() => void createSession()}>{creating ? <LoaderCircle className="animate-spin" /> : <Plus />}{creating ? "作成中…" : "開催を作成する"}</Button></div>
            {createdSession && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold text-emerald-800">開催を作成しました</p><h3 className="mt-1 font-bold">{createdSession.title}</h3><p className="mt-3 font-mono text-3xl font-bold tracking-[0.18em] text-emerald-900">{createdSession.code}</p></div><Button onClick={() => void copyParticipantUrl(createdSession)}>{copiedCode === createdSession.code ? <Check /> : <Clipboard />}{copiedCode === createdSession.code ? "コピーしました" : "参加URLをコピー"}</Button></div><p className="mt-3 break-all text-xs leading-6 text-emerald-800">{participantUrl(createdSession.code)}</p></div>}
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-destructive" role="alert">{error}</p>}
          </CardContent>
        </Card>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><MonitorUp className="text-primary" /><h2 className="text-2xl font-bold">開催一覧</h2></div><Button variant="outline" size="sm" onClick={() => void loadSessions()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />更新</Button></div>
          {loading && sessions.length === 0 ? <div className="rounded-2xl border bg-white p-8 text-center text-sm text-muted-foreground">開催一覧を読み込んでいます…</div> : sessions.length === 0 ? <div className="rounded-2xl border border-dashed bg-white/60 p-8 text-center text-sm text-muted-foreground">まだ開催はありません。上のフォームから最初の開催を作成してください。</div> : <div className="space-y-3">{sessions.map((session) => (
            <article key={session.id} className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{session.title}</h3><Badge variant="secondary">投稿 {session.actionCount}件</Badge></div><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="font-mono text-base font-bold tracking-[0.14em] text-primary">{session.code}</span><span>{new Date(`${session.createdAt}Z`).toLocaleString("ja-JP")}</span></div></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => void copyParticipantUrl(session)}>{copiedCode === session.code ? <Check /> : <Clipboard />}{copiedCode === session.code ? "コピー済み" : "参加URL"}</Button><Button variant="outline" size="sm" onClick={() => void viewResults(session)}><Eye />結果を見る</Button><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 />削除</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>「{session.title}」を削除しますか？</AlertDialogTitle><AlertDialogDescription>開催情報と、この開催に投稿されたプラス1行動がすべて削除されます。この操作は元に戻せません。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>キャンセル</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deletingId === session.id} onClick={() => void deleteSession(session)}>削除する</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
            </article>
          ))}</div>}
        </section>

        {selectedSession && <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{selectedTitle}</CardTitle><CardDescription className="mt-2">投稿結果：{actions.length}件</CardDescription></div><Button variant="outline" size="sm" onClick={() => void viewResults(selectedSession)}><RefreshCw />結果を更新</Button></div></CardHeader><CardContent>{actions.length === 0 ? <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">まだ投稿はありません。</p> : <div className="grid gap-3 md:grid-cols-2">{actions.map((action) => <article key={action.id} className="rounded-2xl border bg-muted/35 p-4"><Badge variant="secondary">項目 {action.itemNumber}</Badge><p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-7">{action.actionText}</p></article>)}</div>}</CardContent></Card>}

        <section>
          <div className="mb-4 flex items-center gap-3"><Timer className="text-primary" /><h2 className="text-2xl font-bold">基本進行：7分</h2></div>
          <div className="space-y-3">{timeline.map(([time, label, detail]) => <div key={time} className="grid gap-2 rounded-2xl border bg-white p-4 sm:grid-cols-[110px_180px_1fr] sm:items-center"><Badge variant="secondary">{time}</Badge><strong>{label}</strong><p className="text-sm leading-6 text-muted-foreground">{detail}</p></div>)}</div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="text-primary" />開始時の案内例</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground">「現在または過去に所属したチームを一つ思い浮かべてください。7項目への回答は保存も共有もされません。最後に、明日から実践する小さな行動を一つだけ匿名で共有します。個人名や会社名は入力しないでください。」</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><ExternalLink className="text-primary" />終了時のまとめ例</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground">「心理的安全性は、リーダーだけがつくるものではありません。ミス、質問、反対意見が出たときの一人ひとりの反応によって少しずつつくられます。今日決めたプラス1行動を、次のチーム活動で一度試してみてください。」</CardContent></Card>
        </div>
      </div>
    </main>
  );
}
