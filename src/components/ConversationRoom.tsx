"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  LANGUAGES,
  languageDir,
  type LanguageCode,
  type PublicMessage,
  type PublicSession,
} from "@/lib/conversation/types";

interface SafeUser {
  name: string;
  email: string;
  preferredLanguage: string;
  culturalContext: string | null;
}

interface ApiError {
  error?: { message?: string };
}

interface SessionsData extends ApiError {
  sessions?: PublicSession[];
}

interface SessionData extends ApiError {
  session?: PublicSession;
}

interface MessagesData extends ApiError {
  messages?: PublicMessage[];
}

type StreamEvent =
  | { type: "delta"; content: string }
  | { type: "done"; message: PublicMessage }
  | { type: "support_offer"; message: PublicMessage }
  | { type: "error"; error?: { message?: string } };

function isLanguage(value: string): value is LanguageCode {
  return LANGUAGES.some((language) => language.code === value);
}

function messageFromError(cause: unknown): string {
  return cause instanceof Error ? cause.message : "Something went wrong. Please try again.";
}

export function ConversationRoom() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<SafeUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [sessions, setSessions] = useState<PublicSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [culturalContext, setCulturalContext] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");

  const activeSession = sessions.find((session) => session.id === activeId) ?? null;
  const direction = languageDir(activeSession?.language ?? language);
  const activeLanguage = activeSession?.language ?? language;
  const latestMessage = messages[messages.length - 1];
  const activeOffer = latestMessage?.kind === "support_offer" ? latestMessage : null;

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        if (!me.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const meData = (await me.json()) as { user: SafeUser };
        const conversations = await fetch("/api/conversations", { cache: "no-store" });
        const sessionsData = (await conversations.json()) as SessionsData;
        if (!conversations.ok) throw new Error(sessionsData.error?.message);

        if (!cancelled) {
          setUser(meData.user);
          setSessions(sessionsData.sessions ?? []);
          setLanguage(isLanguage(meData.user.preferredLanguage) ? meData.user.preferredLanguage : "en");
          setCulturalContext(meData.user.culturalContext ?? "");
        }
      } catch (cause) {
        if (!cancelled) setError(messageFromError(cause));
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, streamingText]);

  async function createSession(): Promise<PublicSession> {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        culturalContext: culturalContext.trim() || undefined,
      }),
    });
    const data = (await response.json()) as SessionData;
    if (!response.ok || !data.session) {
      throw new Error(data.error?.message ?? "The conversation could not be opened.");
    }

    setSessions((current) => [data.session as PublicSession, ...current]);
    return data.session;
  }

  async function startSession(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const session = await createSession();
      setActiveId(session.id);
      setMessages([]);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function openSession(sessionId: string): Promise<void> {
    if (sessionId === activeId) return;
    setBusy(true);
    setError("");
    setActiveId(sessionId);
    try {
      const response = await fetch(`/api/conversations/${sessionId}/messages`, {
        cache: "no-store",
      });
      const data = (await response.json()) as MessagesData;
      if (!response.ok || !data.messages) {
        throw new Error(data.error?.message ?? "The conversation could not be opened.");
      }
      setMessages(data.messages);
      const session = sessions.find((item) => item.id === sessionId);
      if (session) {
        setLanguage(session.language);
        setCulturalContext(session.culturalContext ?? "");
      }
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busy || !user) return;

    setBusy(true);
    setError("");
    setDraft("");

    try {
      const sessionId = activeId ?? (await createSession()).id;
      if (!activeId) setActiveId(sessionId);

      setMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        },
      ]);
      setStreamingText("");

      const response = await fetch(`/api/conversations/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(data.error?.message ?? "The reply could not be started.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError = "";

      const handleEvent = (raw: string): void => {
        const payload = raw
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("");
        if (!payload) return;

        const eventData = JSON.parse(payload) as StreamEvent;
        if (eventData.type === "delta") {
          setStreamingText((current) => current + eventData.content);
        } else if (eventData.type === "done") {
          setMessages((current) => [...current, eventData.message]);
          setStreamingText("");
        } else if (eventData.type === "support_offer") {
          setMessages((current) => [...current, eventData.message]);
        } else if (eventData.type === "error") {
          streamError = eventData.error?.message ?? "The reply could not be completed.";
        }
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          handleEvent(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) handleEvent(buffer);
      if (streamError) throw new Error(streamError);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setStreamingText("");
      setBusy(false);
    }
  }

  async function respondToSupport(decision: "accepted" | "declined"): Promise<void> {
    if (!activeId || !activeOffer || busy) return;

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/support/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeId,
          decision,
          jurisdiction: activeSession?.culturalContext?.trim() || undefined,
        }),
      });
      const data = (await response.json()) as MessagesData;
      if (!response.ok || !data.messages) {
        throw new Error(data.error?.message ?? "Your response could not be recorded.");
      }
      setMessages((current) => [...current, ...(data.messages as PublicMessage[])]);
    } catch (cause) {
      setError(messageFromError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function signOut(): Promise<void> {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <p className="text-sm text-ink/55">Opening your room…</p>;
  }

  if (!user) {
    return (
      <div className="rounded-[28px] border border-ink/10 bg-white/60 p-8 text-center">
        <h2 className="font-display text-2xl">Your room is waiting</h2>
        <p className="mt-3 text-sm text-ink/60">Sign in to begin or return to a conversation.</p>
        <Link
          href="/sign-in"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-paper"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-[24px] border border-ink/10 bg-white/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Signed in</p>
            <p className="mt-1 truncate text-sm font-medium">{user.name}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={busy}
            className="text-xs text-ink/55 underline underline-offset-4 hover:text-ink disabled:opacity-50"
          >
            Sign out
          </button>
        </div>

        <button
          type="button"
          onClick={() => void startSession()}
          disabled={busy}
          className="mt-6 w-full rounded-full border border-ink/20 px-4 py-2.5 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          New conversation
        </button>

        <div className="mt-6 space-y-3">
          <label className="block text-xs font-medium text-ink/60">
            Language
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as LanguageCode)}
              disabled={busy}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50"
            >
              {LANGUAGES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-ink/60">
            Cultural context <span className="text-ink/40">(optional)</span>
            <input
              value={culturalContext}
              onChange={(event) => setCulturalContext(event.target.value)}
              maxLength={120}
              disabled={busy}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50"
            />
          </label>
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Your conversations</p>
          <div className="mt-3 space-y-2">
            {sessions.length === 0 && (
              <p className="text-sm text-ink/45">No conversations yet.</p>
            )}
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => void openSession(session.id)}
                disabled={busy}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                  session.id === activeId
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-transparent text-ink/65 hover:border-ink/15 hover:text-ink"
                }`}
              >
                <span className="block font-medium">
                  {LANGUAGES.find((item) => item.code === session.language)?.label}
                </span>
                <span className="text-xs text-ink/45">
                  {new Date(session.createdAt).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex min-h-[620px] flex-col rounded-[24px] border border-ink/10 bg-white/60">
        <header className="border-b border-ink/10 px-6 py-5">
          <h2 className="font-display text-2xl">
            {activeSession ? "A quiet conversation" : "Begin when you are ready"}
          </h2>
          <p className="mt-1 text-xs text-ink/50">
            Support is offered, never automatic. This is not a substitute for professional care.
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6" dir={direction} lang={activeLanguage}>
          {!activeSession && (
            <p className="max-w-md text-sm leading-relaxed text-ink/55">
              Choose a language, then write whatever is present. Your words stay in this private
              conversation.
            </p>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-auto bg-ink text-paper"
                  : "border border-ink/10 bg-paper/70 text-ink"
              }`}
            >
              {message.content}
            </article>
          ))}

          {streamingText && (
            <article
              aria-live="polite"
              className="max-w-[85%] rounded-2xl border border-ink/10 bg-paper/70 px-4 py-3 text-sm leading-relaxed text-ink"
            >
              {streamingText}
              <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-accent align-middle" />
            </article>
          )}
          <div ref={bottomRef} />
        </div>

        {activeOffer && (
          <div
            role="group"
            aria-label="Support offer"
            className="mx-6 mb-3 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3"
          >
            <p className="text-sm font-medium text-ink">Your choice</p>
            <p className="mt-1 text-xs text-ink/60">
              Nothing is sent or shared unless you ask. You can decline and continue here.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void respondToSupport("accepted")}
                disabled={busy}
                className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                See support options
              </button>
              <button
                type="button"
                onClick={() => void respondToSupport("declined")}
                disabled={busy}
                className="rounded-full border border-ink/20 px-4 py-2 text-xs font-medium text-ink/70 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="px-6 pb-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={sendMessage} className="border-t border-ink/10 p-4" dir={direction}>
          <div className="flex items-end gap-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              maxLength={4000}
              disabled={busy}
              aria-label="Your message"
              placeholder="Write here…"
              className="min-h-12 flex-1 resize-none rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
