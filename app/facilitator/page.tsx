"use client";

import { useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink, MonitorUp, Timer, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const timeline = [
  ["0:00–0:30", "目的とルール", "回答は本人だけが見ます。最後の行動のみ匿名共有します。"],
  ["0:30–1:00", "チームを決める", "現在または過去のチームを一つ思い浮かべてもらいます。"],
  ["1:00–3:00", "7項目チェック", "Yes／No／わからないで、各自回答してもらいます。"],
  ["3:00–4:00", "項目を一つ選ぶ", "気になる、または自分から動けそうな項目を選びます。"],
  ["4:00–6:00", "プラス1行動", "明日からできる小さな行動を具体的に書きます。"],
  ["6:00–7:00", "匿名投稿・共有", "一覧を画面共有し、2〜3件を講師が読み上げます。"],
];

export default function FacilitatorGuide() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const cleanCode = code.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
  const valid = cleanCode.length >= 3;
  const links = useMemo(() => {
    if (typeof window === "undefined" || !valid) return { participant: "", board: "" };
    const origin = window.location.origin;
    return {
      participant: `${origin}/?session=${encodeURIComponent(cleanCode)}`,
      board: `${origin}/?session=${encodeURIComponent(cleanCode)}&view=board`,
    };
  }, [cleanCode, valid]);

  async function copyLink() {
    if (!links.participant) return;
    await navigator.clipboard.writeText(links.participant);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="rounded-3xl bg-[#173f37] px-6 py-8 text-white sm:px-10">
          <Badge className="mb-4 bg-white/15 text-white">講師用</Badge>
          <h1 className="text-3xl font-bold sm:text-4xl">心理的安全性ワーク<br />進行ガイド</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75">7項目の自己チェックから、匿名の「プラス1行動」共有までを7分で進めるためのガイドです。</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><MonitorUp className="text-primary" />開催用URLを作る</CardTitle>
            <CardDescription>開催ごとに別のコードを使うと、以前の投稿と混ざりません。英数字・ハイフンで3文字以上にしてください。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="例：0830-A または safety01" />
              <Button disabled={!valid} onClick={copyLink}>{copied ? <Check /> : <Clipboard />}{copied ? "コピーしました" : "参加URLをコピー"}</Button>
            </div>
            {valid && <div className="rounded-2xl bg-muted p-4 text-xs leading-6 text-muted-foreground"><strong className="text-foreground">参加者用URL</strong><br /><span className="break-all">{links.participant}</span></div>}
            <div className="flex flex-wrap gap-2">
              {valid ? <Button variant="outline" asChild><a href={links.participant} target="_blank" rel="noreferrer"><Users />参加者画面を開く <ExternalLink /></a></Button> : <Button variant="outline" disabled><Users />参加者画面を開く</Button>}
              {valid ? <Button variant="outline" asChild><a href={links.board} target="_blank" rel="noreferrer"><MonitorUp />投稿一覧を開く <ExternalLink /></a></Button> : <Button variant="outline" disabled><MonitorUp />投稿一覧を開く</Button>}
            </div>
          </CardContent>
        </Card>

        <section>
          <div className="mb-4 flex items-center gap-3"><Timer className="text-primary" /><h2 className="text-2xl font-bold">基本進行：7分</h2></div>
          <div className="space-y-3">
            {timeline.map(([time, title, detail]) => <div key={time} className="grid gap-2 rounded-2xl border bg-white p-4 sm:grid-cols-[110px_180px_1fr] sm:items-center"><Badge variant="secondary">{time}</Badge><strong>{title}</strong><p className="text-sm leading-6 text-muted-foreground">{detail}</p></div>)}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>開始時の案内例</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground"><p>「現在または過去に所属したチームを一つ思い浮かべてください。7項目への回答は保存も共有もされません。最後に、明日から実践する小さな行動を一つだけ匿名で共有します。個人名や会社名は入力しないでください。」</p></CardContent></Card>
          <Card><CardHeader><CardTitle>終了時のまとめ例</CardTitle></CardHeader><CardContent className="text-sm leading-7 text-muted-foreground"><p>「心理的安全性は、リーダーだけがつくるものではありません。ミス、質問、反対意見が出たときの一人ひとりの反応によって少しずつつくられます。今日決めたプラス1行動を、次のチーム活動で一度試してみてください。」</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>開催前チェック</CardTitle></CardHeader>
          <CardContent><ul className="grid gap-3 text-sm leading-6 sm:grid-cols-2">{[
            "開催コードを決め、参加URLをZoomチャットへ送る",
            "教室参加者にも同じURLまたはQRコードを案内する",
            "講師は投稿一覧を別タブで開き、画面共有できるようにする",
            "回答と発表は任意で、個人名・会社名を書かないと伝える",
            "時間が押したら、一覧の読み上げを省略して締める",
            "サイトが使えない場合は、プラス1行動だけZoomチャットで共有する",
          ].map((item) => <li key={item} className="flex gap-2 rounded-xl bg-muted/60 p-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{item}</li>)}</ul></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>時間調整</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border p-4"><strong>5分版</strong><p className="mt-2 text-sm leading-6 text-muted-foreground">チェック2分、選択1分、行動作成・投稿2分。読み上げなし。</p></div>
            <div className="rounded-2xl border border-primary bg-secondary/50 p-4"><strong>7分版・推奨</strong><p className="mt-2 text-sm leading-6 text-muted-foreground">基本進行どおり。投稿を2〜3件紹介。</p></div>
            <div className="rounded-2xl border p-4"><strong>10分版</strong><p className="mt-2 text-sm leading-6 text-muted-foreground">投稿を4〜5件紹介し、共通点を全体で確認。</p></div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
