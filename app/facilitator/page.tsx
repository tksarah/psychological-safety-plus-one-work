import { env } from "cloudflare:workers";
import { ShieldX } from "lucide-react";
import { requireChatGPTUser } from "../chatgpt-auth";
import FacilitatorDashboard from "./facilitator-dashboard";

export const dynamic = "force-dynamic";

export default async function FacilitatorPage() {
  const user = await requireChatGPTUser("/facilitator");
  const instructorEmail = (
    env as unknown as { INSTRUCTOR_EMAIL?: string }
  ).INSTRUCTOR_EMAIL?.trim().toLowerCase();

  if (!instructorEmail || user.email.trim().toLowerCase() !== instructorEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
          <ShieldX className="mx-auto mb-4 size-10 text-destructive" />
          <h1 className="text-xl font-bold">講師用ページにアクセスできません</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">このページはサイト管理者だけが利用できます。</p>
        </div>
      </main>
    );
  }

  return <FacilitatorDashboard displayName={user.displayName} />;
}
