import Link from "next/link";
import { ConversationRoom } from "@/components/ConversationRoom";

export const dynamic = "force-dynamic";

export default function ConversationPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <Link href="/" className="flex items-center gap-3" aria-label="Ruh Al Ruh, home">
          <svg viewBox="0 0 40 40" className="h-9 w-9 text-ink" aria-hidden="true">
            <path
              d="M7 33V18a13 13 0 0 1 26 0v15M14 33V20a6 6 0 0 1 12 0v13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="20" cy="24" r="1.7" fill="currentColor" />
          </svg>
          <span className="font-display text-xl tracking-tight">Ruh Al Ruh</span>
        </Link>
        <Link href="/" className="text-sm text-ink/60 underline underline-offset-4 hover:text-ink">
          Home
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <ConversationRoom />
      </main>
    </div>
  );
}
