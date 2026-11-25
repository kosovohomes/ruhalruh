import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

export default function SignInPage() {
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
          Back to home
        </Link>
      </header>

      <main className="mx-auto grid max-w-5xl items-start gap-12 px-6 pb-24 pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:pt-16">
        <div className="lg:pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Your room</p>
          <h2 className="font-display mt-4 text-4xl leading-tight tracking-tight sm:text-5xl">
            Come in when you are ready.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-ink/65">
            This is a quiet place to write in your own language. You decide what to share, and
            support is always offered — never decided for you.
          </p>
          <p className="mt-8 text-sm text-ink/50">
            Your account and conversations are saved to hosted storage. Nothing is shared without
            your choice.
          </p>
        </div>
        <AuthForm />
      </main>
    </div>
  );
}
