import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "心理的安全性 プラス1行動ワーク",
  description:
    "7つの問いでチームを振り返り、明日から実践する小さな行動を一つ決める7分間のワークです。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
