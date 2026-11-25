import Link from "next/link";
import { LanguagePreview } from "@/components/LanguagePreview";

const steps = [
  {
    number: "01",
    title: "Arrive as you are",
    body: "Create a private account, choose a language, and begin with whatever is present for you.",
  },
  {
    number: "02",
    title: "Speak in your own words",
    body: "Text now, voice later. Cultural context shapes the response, so the conversation does not have to translate your life into someone else's terms.",
  },
  {
    number: "03",
    title: "Choose your support",
    body: "When the assistant notices a difficult moment, it offers resources and a conversation. You decide what happens next. Nothing is sent on your behalf.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <a href="#top" className="flex items-center gap-3" aria-label="Ruh Al Ruh, home">
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
        </a>
        <nav className="hidden items-center gap-8 text-sm text-ink/70 md:flex" aria-label="Main">
          <a className="hover:text-ink" href="#how-it-works">How it works</a>
          <a className="hover:text-ink" href="#safety">Safety</a>
          <a className="hover:text-ink" href="#languages">Languages</a>
        </nav>
        <Link
          href="/sign-in"
          className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper"
        >
          Sign in
        </Link>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white/50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-ink/60">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Available day and night
            </p>
            <h1 className="font-display mt-7 max-w-2xl text-5xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              A place to be heard, <em className="text-accent">in your own language.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink/70">
              Ruh Al Ruh is a quiet, steady companion for the moments that are hard to carry alone.
              Write in the language that feels familiar, and decide for yourself when support
              should grow.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/conversation"
                className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper shadow-[0_18px_40px_-20px_rgba(18,59,58,0.8)] transition-transform hover:-translate-y-0.5"
              >
                Begin a conversation
              </Link>
              <Link href="/sign-in" className="text-sm font-medium text-ink/70 underline underline-offset-4 hover:text-ink">
                Create an account
              </Link>
            </div>
            <p className="mt-6 text-xs text-ink/45">
              Text conversations work locally. Hosted storage begins when a Neon database is connected.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
            <div className="doorway">
              <div className="doorway__halo" />
              <div className="doorway__arch doorway__arch--outer" />
              <div className="doorway__arch doorway__arch--middle" />
              <div className="doorway__arch doorway__arch--inner" />
              <div className="doorway__light" />
            </div>
            <p className="mt-6 text-center text-xs uppercase tracking-[0.2em] text-ink/40">
              always open
            </p>
          </div>
        </section>

        <section className="border-y border-ink/10 bg-white/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 text-sm text-ink/70 sm:grid-cols-3">
            <p><span className="font-semibold text-ink">Day and night.</span> The room does not close.</p>
            <p><span className="font-semibold text-ink">Your words stay yours.</span> You choose who is involved.</p>
            <p><span className="font-semibold text-ink">Support is offered.</span> Never decided for you.</p>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">How it works</p>
            <h2 className="font-display mt-4 text-4xl tracking-tight sm:text-5xl">
              A conversation, not a procedure.
            </h2>
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="border-t border-ink/20 pt-6">
                <p className="font-display text-3xl text-accent">{step.number}</p>
                <h3 className="font-display mt-5 text-2xl">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-ink/65">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="safety" className="bg-ink text-paper">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-paper/50">Safety</p>
              <h2 className="font-display mt-4 text-4xl tracking-tight sm:text-5xl">
                Help is yours to choose.
              </h2>
              <p className="mt-6 max-w-lg leading-relaxed text-paper/70">
                Ruh Al Ruh never alerts anyone on your behalf and never keeps a hidden score about
                you. If something you write suggests you need support, the assistant offers it
                gently — and stays with you while you decide.
              </p>
              <p className="mt-6 text-sm text-paper/50">
                This service is not a substitute for professional care. If you are in immediate
                danger, contact your local emergency services.
              </p>
            </div>
            <div className="space-y-4">
              {[
                ["Nothing automatic", "No forced escalation, no third-party notification."],
                ["Planned resources", "Reviewed local contacts arrive in the next release."],
                ["Visible choices", "Any request for support appears in your own conversation."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-paper/15 bg-paper/5 p-6">
                  <h3 className="font-display text-xl">{title}</h3>
                  <p className="mt-2 text-sm text-paper/65">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="languages" className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Language</p>
              <h2 className="font-display mt-4 text-4xl tracking-tight sm:text-5xl">
                Begin in the language you think in.
              </h2>
              <p className="mt-6 leading-relaxed text-ink/65">
                Select a language below to hear how a first greeting could sound. In the
                conversation, your language and cultural context shape every reply.
              </p>
            </div>
            <LanguagePreview />
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-ink/55 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg text-ink">Ruh Al Ruh</p>
          <p>Soul of the soul · A quiet place, always open.</p>
          <p>Text preview · Phase 3</p>
        </div>
      </footer>
    </div>
  );
}
