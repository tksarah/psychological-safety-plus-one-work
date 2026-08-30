"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookmarkCheck, Lightbulb, RefreshCw, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Answer, answerLabel, questions, reflectionLabel } from "@/lib/workshop";

type PostedAction = { id: number; itemNumber: number; actionText: string; createdAt: string };
const answerOptions: Answer[] = ["yes", "no", "unknown"];

export default function Home() {
  const [sessionCode, setSessionCode] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [checkingSession, setCheckingSession] = useState(false);
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [actionText, setActionText] = useState("");
  const [postedActions, setPostedActions] = useState<PostedAction[]>([]);
  const [myActionId, setMyActionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get("session") ?? "").toUpperCase();
    if (!code) return;
    setJoinCode(code);
    if (!/^[A-Z2-9]{6}$/.test(code)) {
      setError("開催コードが正しくありません。講師から案内されたコードを確認してください。");
      return;
    }

    setCheckingSession(true);
    void fetch(`/api/session?code=${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "開催情報を確認できませんでした。");
        setSessionCode(body.session.code);
        setSessionTitle(body.session.title);
        if (params.get("view") === "board") setStep(5);
      })
      .catch((sessionError) => setError(sessionError instanceof Error ? sessionError.message : "開催情報を確認できませんでした。"))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!sessionCode) return;
    try {
      const stored = window.localStorage.getItem(`ps-workshop:${sessionCode}:my-action`);
      if (stored && Number.isInteger(Number(stored))) setMyActionId(Number(stored));
    } catch {
      // The marker is a device-local convenience; the workshop still works without storage.
    }
  }, [sessionCode]);

  const loadActions = useCallback(async () => {
    if (!sessionCode) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/actions?session=${encodeURIComponent(sessionCode)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "投稿を読み込めませんでした。");
      setPostedActions(body.actions);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "投稿を読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, [sessionCode]);

  useEffect(() => {
    if (step !== 5 || !sessionCode) return;
    void loadActions();
    const timer = window.setInterval(() => void loadActions(), 5000);
    return () => window.clearInterval(timer);
  }, [step, sessionCode, loadActions]);

  const allAnswered = questions.every((question) => answers[question.number]);
  const selectedQuestion = questions.find((question) => question.number === selectedItem);
  const progress = step === 5 ? 100 : step * 22;
  const recommendedItems = useMemo(() => questions.filter((question) => {
    const answer = answers[question.number];
    return answer && (answer === "unknown" || (question.reverse ? answer === "yes" : answer === "no"));
  }), [answers]);
  const displayedActions = useMemo(() => {
    if (!myActionId) return postedActions;
    return [...postedActions].sort((left, right) => {
      if (left.id === myActionId) return -1;
      if (right.id === myActionId) return 1;
      return 0;
    });
  }, [postedActions, myActionId]);

  async function joinSession() {
    const clean = joinCode.trim().toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(clean)) {
      setError("講師から案内された6文字の開催コードを入力してください。");
      return;
    }
    setCheckingSession(true);
    setError("");
    try {
      const response = await fetch(`/api/session?code=${encodeURIComponent(clean)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "開催情報を確認できませんでした。");
      window.location.href = `/?session=${encodeURIComponent(clean)}`;
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "開催情報を確認できませんでした。");
      setCheckingSession(false);
    }
  }

  async function submitAction() {
    if (!selectedItem || actionText.trim().length < 4) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionCode, itemNumber: selectedItem, actionText }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "投稿できませんでした。");
      setMyActionId(body.action.id);
      try {
        window.localStorage.setItem(`ps-workshop:${sessionCode}:my-action`, String(body.action.id));
      } catch {
        // The personal marker is optional and does not affect the anonymous post.
      }
      setStep(5);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "投稿できませんでした。");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession && !sessionCode) {
    return <main className="flex min-h-screen items-center justify-center px-4"><div className="rounded-2xl border bg-white px-6 py-5 text-sm text-muted-foreground shadow-sm">開催情報を確認しています…</div></main>;
  }

  if (!sessionCode) {
    return (
      <main className="welcome-page min-h-screen overflow-hidden">
        <section className="welcome-hero mx-auto grid min-h-[82vh] max-w-[1320px] items-center gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <div className="relative z-10 mx-auto w-full max-w-[720px] lg:mx-0">
            <p className="welcome-kicker">心理的安全性　ミニワーク</p>
            <h1 className="welcome-title mt-5 leading-[1.18]">
              <span>あしたの会話を、</span>
              <span>少しだけ変えてみる。</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-8 text-[#5f625b] sm:text-base">
              7つの問いから、いつものチームを静かに振り返ります。最後に、自分から始められる小さな行動をひとつ選びましょう。
            </p>

            <div className="welcome-tags mt-7 flex flex-wrap gap-2.5 text-xs text-[#63655f]">
              <span>約7分</span><span>個人ワーク</span><span>回答は保存されません</span>
            </div>

            <div className="join-note mt-9 w-full max-w-[510px] px-5 py-6 sm:px-7 sm:py-7">
              <p className="text-[13px] font-bold tracking-[0.08em] text-[#a24f42]">はじめる準備</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-[#343a35] sm:text-2xl">開催コードを入力してください</h2>
              <p className="mt-2 text-sm leading-6 text-[#70736c]">講師から案内された6文字のコードです。</p>
              <div className="mt-5 overflow-x-auto pb-1">
                <InputOTP
                  maxLength={6}
                  value={joinCode}
                  onChange={(value) => setJoinCode(value.toUpperCase().replace(/[^A-Z2-9]/g, ""))}
                  containerClassName="min-w-max"
                  aria-label="6文字の開催コード"
                >
                  <InputOTPGroup className="gap-1.5 sm:gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} className="welcome-code-slot h-12 w-10 font-mono text-lg font-bold sm:h-[3.25rem] sm:w-12" />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button className="welcome-start mt-5 h-12 w-full text-[15px]" disabled={checkingSession || joinCode.length !== 6} onClick={() => void joinSession()}>
                {checkingSession ? "開催を確認しています…" : "ワークを始める"}<ArrowRight />
              </Button>
              {error && <p className="mt-4 border-l-2 border-destructive pl-3 text-sm text-destructive" role="alert">{error}</p>}
              <p className="mt-4 text-xs leading-6 text-[#777a72]">匿名で実施できます。</p>
            </div>
          </div>

          <figure className="watercolor-figure relative mx-auto w-full max-w-3xl self-stretch lg:min-h-[690px]">
            <img src="/watercolor-conversation-no-people.png" alt="対話の準備が整った丸いテーブルと椅子、カップ、ノート、植物の水彩画" className="h-full min-h-[390px] w-full object-contain object-center lg:min-h-[690px]" />
            <figcaption className="watercolor-caption absolute bottom-[5%] left-[4%] max-w-[260px] -rotate-2 text-sm leading-7 text-[#62665f] sm:left-[8%] lg:hidden">
              答えに正解はありません。<br />思い浮かぶままで大丈夫です。
            </figcaption>
          </figure>
        </section>

        <section className="welcome-steps mx-auto max-w-5xl px-5 pb-16 pt-4 sm:px-8 sm:pb-20">
          <p className="text-center text-sm font-bold tracking-[0.12em] text-[#6d7169]">ワークの流れ</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
            {[
              ["1", "振り返る", "思い浮かべたチームについて、7つの問いに答えます。"],
              ["2", "ひとつ選ぶ", "気になった問いから、自分が大切にしたいことを選びます。"],
              ["3", "行動にする", "明日からできる小さな行動にして、匿名で共有します。"],
            ].map(([number, label, detail]) => (
              <article key={number} className="welcome-step relative pl-14">
                <span className="welcome-step-number absolute left-0 top-0 flex size-10 items-center justify-center text-base font-bold">{number}</span>
                <h2 className="text-lg font-bold text-[#3f4640]">{label}</h2>
                <p className="mt-2 text-sm leading-7 text-[#71746d]">{detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="paper-shell min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-start justify-between gap-4 border-b border-foreground/20 pb-5">
          <div><p className="rule-label mb-1 text-[10px] font-bold text-[#9b3e31]">Psychological Safety / Workshop</p><h1 className="editorial-title text-2xl sm:text-3xl">プラス1行動ワーク</h1><p className="mt-2 text-xs text-muted-foreground">{sessionTitle}</p></div>
          <Badge variant="outline" className="font-mono tracking-wider">{sessionCode}</Badge>
        </header>

        <div className="mb-7 border bg-[#fffdf8] p-4">
          <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground"><span>{step === 5 ? "みんなのプラス1行動" : `STEP ${step} / 4`}</span><span>{step === 5 ? "完了" : `${progress}%`}</span></div>
          <Progress value={progress} />
        </div>

        {step === 1 && (
          <Card>
            <CardHeader><div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary"><Users /></div><CardTitle className="text-2xl">振り返るチームを一つ決める</CardTitle><CardDescription className="text-base leading-7">現在または過去に所属したチームを一つ思い浮かべてください。</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">{["職場・部署", "プロジェクト", "学校・地域・コミュニティ"].map((label) => <div key={label} className="rounded-2xl border bg-muted/45 p-4 text-center text-sm font-medium">{label}</div>)}</div>
              <p className="text-sm leading-7 text-muted-foreground">チーム名を入力する必要はありません。頭の中で一つ決めれば大丈夫です。</p>
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep(2)}>思い浮かべました <ArrowRight /></Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div className="mb-5"><h2 className="text-2xl font-bold">7つの問いに答える</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">思い浮かべたチームについて、Yes／No／わからないで回答してください。回答は保存されません。</p></div>
            {questions.map((question) => (
              <Card key={question.number} className="gap-4 py-5 shadow-none">
                <CardContent className="grid gap-4 px-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">{question.number}</span><p className="pt-1 text-sm font-medium leading-6 sm:text-base">{question.text}</p></div>
                  <RadioGroup className="grid grid-cols-3 gap-2" value={answers[question.number]} onValueChange={(value) => setAnswers((current) => ({ ...current, [question.number]: value as Answer }))} aria-label={`設問${question.number}の回答`}>
                    {answerOptions.map((option) => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs hover:border-primary sm:text-sm"><RadioGroupItem value={option} />{answerLabel(option)}</label>)}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft />戻る</Button><Button size="lg" disabled={!allAnswered} onClick={() => setStep(3)}>回答を振り返る <ArrowRight /></Button></div>
          </section>
        )}

        {step === 3 && (
          <section>
            <div className="mb-5"><h2 className="text-2xl font-bold">気になる項目を一つ選ぶ</h2><p className="mt-2 text-sm leading-7 text-muted-foreground">「もう少し良くしたい」「自分から行動できそう」と感じる項目を選んでください。</p></div>
            {recommendedItems.length > 0 && <div className="mb-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><Lightbulb className="mt-0.5 size-5 shrink-0" /><p>「少し気になる」または「まだ判断できない」となった項目に印を付けています。別の項目を選んでも構いません。</p></div>}
            <RadioGroup className="space-y-3" value={selectedItem?.toString()} onValueChange={(value) => setSelectedItem(Number(value))}>
              {questions.map((question) => {
                const label = reflectionLabel(question.reverse, answers[question.number]);
                const attention = label !== "できている点";
                return <label key={question.number} className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 transition hover:border-primary ${selectedItem === question.number ? "border-primary ring-2 ring-primary/15" : ""}`}><RadioGroupItem className="mt-1" value={question.number.toString()} /><span className="min-w-0 flex-1"><span className="mb-1 flex flex-wrap items-center gap-2"><strong>項目 {question.number}</strong><Badge variant={attention ? "secondary" : "outline"}>{label}</Badge></span><span className="block text-sm leading-6 text-muted-foreground">{question.text}</span></span></label>;
              })}
            </RadioGroup>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft />戻る</Button><Button size="lg" disabled={!selectedItem} onClick={() => setStep(4)}>行動を考える <ArrowRight /></Button></div>
          </section>
        )}

        {step === 4 && selectedQuestion && (
          <Card>
            <CardHeader><Badge variant="secondary">選んだ項目 {selectedQuestion.number}</Badge><CardTitle className="pt-2 text-2xl">自分の「プラス1行動」を決める</CardTitle><CardDescription className="text-base leading-7">明日から試せる、小さく具体的な行動を書いてください。</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl bg-muted p-4"><p className="text-xs font-bold text-primary">選んだ問い</p><p className="mt-2 text-sm leading-6">{selectedQuestion.text}</p></div>
              <div><label htmlFor="plus-action" className="mb-2 block text-sm font-semibold">次に「〇〇」が起きたら、私は「△△」と言う／行う</label><Textarea id="plus-action" className="min-h-32 resize-y bg-white text-base leading-7" maxLength={160} value={actionText} onChange={(event) => setActionText(event.target.value)} placeholder="例：次にメンバーからミスの報告を受けたら、最初に『早く教えてくれてありがとう』と伝える。" /><p className="mt-1 text-right text-xs text-muted-foreground">{actionText.length} / 160文字</p></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-900">考えるヒント</p><p className="mt-2 text-sm leading-6 text-amber-900">{selectedQuestion.action}</p><Button variant="outline" size="sm" className="mt-3 bg-white" onClick={() => setActionText(selectedQuestion.action)}>この例を使って整える</Button></div>
              <p className="text-xs leading-6 text-muted-foreground">投稿は匿名で全員に共有されます。個人名・会社名・機密情報は書かないでください。</p>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><Button variant="ghost" onClick={() => setStep(3)}><ArrowLeft />戻る</Button><Button size="lg" disabled={loading || actionText.trim().length < 4} onClick={submitAction}><Send />{loading ? "投稿中…" : "匿名で共有する"}</Button></div>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <section>
            <div className="mb-6 border-l-4 border-[#9b3e31] bg-foreground px-5 py-6 text-white sm:px-8"><p className="rule-label text-[10px] font-bold text-white/60">Shared actions</p><h2 className="editorial-title mt-2 text-2xl">みんなのプラス1行動</h2><p className="mt-2 text-sm leading-6 text-white/70">小さな行動の積み重ねが、質問・報告・意見を言いやすいチームをつくります。</p></div>
            {myActionId && <div className="mb-4 flex items-center gap-2 border border-[#9b3e31]/35 bg-[#fff8ed] px-4 py-3 text-xs text-[#78372c]"><BookmarkCheck className="size-4" /><span>赤いしおりの付いた投稿が、あなたのプラス1行動です。この目印はこの端末でだけ表示されます。</span></div>}
            <div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{postedActions.length}件の行動</p><Button variant="outline" size="sm" onClick={() => void loadActions()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />更新</Button></div>
            {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-destructive" role="alert">{error}</p>}
            {postedActions.length === 0 && !loading ? <div className="border border-dashed bg-white/60 p-10 text-center text-muted-foreground">最初の投稿を待っています。</div> : <div className="grid gap-4 md:grid-cols-2">{displayedActions.map((action) => {
              const mine = myActionId === action.id;
              return <article key={action.id} className={`relative border bg-[#fffdf8] p-5 ${mine ? "border-[#9b3e31] border-l-4 bg-[#fff8ed]" : ""}`}>{mine && <div className="absolute -top-px right-4 flex items-center gap-1 bg-[#9b3e31] px-3 py-1 text-[10px] font-bold text-white"><BookmarkCheck className="size-3" />あなた</div>}<div className="mb-3"><Badge variant="outline">項目 {action.itemNumber}</Badge></div><p className="whitespace-pre-wrap text-sm font-medium leading-7">{action.actionText}</p></article>;
            })}</div>}
          </section>
        )}
      </div>
    </main>
  );
}
