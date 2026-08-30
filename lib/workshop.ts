export const questions = [
  { number: 1, text: "業務や仕事で失敗・ミスをすると、非難される", reverse: true, action: "ミスの報告を受けたら、最初に『早く教えてくれてありがとう』と伝える" },
  { number: 2, text: "チームメンバーは、他者と自分が違うことを理由に拒絶・否定することがある", reverse: true, action: "自分と異なる意見に対して、否定する前に理由を聞く" },
  { number: 3, text: "チームメンバーは、困難や課題、問題を率直に指摘・提起し合える", reverse: false, action: "問題を指摘した人に『提起してくれてありがとう』と伝える" },
  { number: 4, text: "質問・反対意見・挑戦など、対人関係上のリスクを取っても安全だと感じる", reverse: false, action: "自分から『分からないので教えてください』と言ってみる" },
  { number: 5, text: "他のチームメンバーに助けを求めることができる", reverse: false, action: "『困っていることはありませんか』と自分から声をかける" },
  { number: 6, text: "チームメンバーは、あなたの仕事を意図的におとしめるような行動をしない", reverse: false, action: "成果やアイデアを、発案した本人のものとしてきちんと扱う" },
  { number: 7, text: "チームメンバーと仕事をするとき、自分のスキルと才能が尊重され、活かされていると感じる", reverse: false, action: "相手の強みを具体的な言葉で伝え、その力を借りる" },
] as const;

export type Answer = "yes" | "no" | "unknown";

export function answerLabel(answer: Answer) {
  if (answer === "yes") return "Yes";
  if (answer === "no") return "No";
  return "わからない";
}

export function reflectionLabel(reverse: boolean, answer: Answer) {
  if (answer === "unknown") return "まだ判断できない";
  const needsAttention = reverse ? answer === "yes" : answer === "no";
  return needsAttention ? "少し気になる" : "できている点";
}
