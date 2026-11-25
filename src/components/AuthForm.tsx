"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LANGUAGES, type LanguageCode } from "@/lib/conversation/types";

type Mode = "sign-in" | "register" | "reset-request" | "reset-confirm";

interface FormState {
  name: string;
  email: string;
  password: string;
  newPassword: string;
  language: LanguageCode;
  culturalContext: string;
  token: string;
}

interface ApiResponse {
  error?: { message?: string };
  devResetToken?: string;
}

const MODES: ReadonlyArray<{ id: Mode; label: string }> = [
  { id: "sign-in", label: "Sign in" },
  { id: "register", label: "Create account" },
  { id: "reset-request", label: "Reset password" },
];

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    newPassword: "",
    language: "en",
    culturalContext: "",
    token: "",
  });

  function update(field: keyof FormState, value: string): void {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseMode(next: Mode): void {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function post(path: string, body: unknown): Promise<ApiResponse> {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message ?? "The request could not be completed.");
    }
    return data;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (mode === "sign-in") {
        await post("/api/auth/login", { email: form.email, password: form.password });
        router.push("/conversation");
        router.refresh();
        return;
      }

      if (mode === "register") {
        await post("/api/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          preferredLanguage: form.language,
          culturalContext: form.culturalContext.trim() || undefined,
        });
        router.push("/conversation");
        router.refresh();
        return;
      }

      if (mode === "reset-request") {
        const data = await post("/api/auth/password-reset/request", { email: form.email });
        if (data.devResetToken) {
          update("token", data.devResetToken);
          setMode("reset-confirm");
          setNotice("Local preview token created. Use it below to choose a new password.");
        } else {
          setNotice("If an account exists, a reset link has been prepared.");
        }
        return;
      }

      await post("/api/auth/password-reset/confirm", {
        token: form.token,
        password: form.newPassword,
      });
      update("newPassword", "");
      update("token", "");
      setMode("sign-in");
      setNotice("Password updated. Sign in with your new password.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The request could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-ink/10 bg-white/60 p-6 shadow-[0_24px_70px_-45px_rgba(18,59,58,0.55)] sm:p-8">
      {mode !== "reset-confirm" && (
        <div className="mb-7 flex flex-wrap gap-2" role="group" aria-label="Account action">
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => chooseMode(item.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                mode === item.id
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 text-ink/70 hover:border-ink/40 hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <h1 className="font-display text-3xl tracking-tight">
        {mode === "sign-in" && "Welcome back"}
        {mode === "register" && "Begin here"}
        {mode === "reset-request" && "Reset your password"}
        {mode === "reset-confirm" && "Choose a new password"}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">
        {mode === "sign-in" && "Sign in to return to your conversations."}
        {mode === "register" && "Create a private account. No form comes before your first hello."}
        {mode === "reset-request" && "Enter the email address on your account."}
        {mode === "reset-confirm" && "Paste the local preview token and choose a new password."}
      </p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        {mode === "register" && (
          <>
            <label className="block text-sm">
              <span className="font-medium">Name</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 outline-none focus:border-accent"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                autoComplete="name"
                minLength={2}
                maxLength={80}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Language</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 outline-none focus:border-accent"
                value={form.language}
                onChange={(event) => update("language", event.target.value)}
              >
                {LANGUAGES.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium">Cultural context <span className="text-ink/45">(optional)</span></span>
              <input
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 outline-none focus:border-accent"
                value={form.culturalContext}
                onChange={(event) => update("culturalContext", event.target.value)}
                maxLength={120}
                placeholder="What would you like the assistant to understand?"
              />
            </label>
          </>
        )}

        {(mode === "sign-in" || mode === "register" || mode === "reset-request") && (
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <input
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 outline-none focus:border-accent"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="email"
              required
            />
          </label>
        )}

        {(mode === "sign-in" || mode === "register") && (
          <label className="block text-sm">
            <span className="font-medium">Password</span>
            <input
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 outline-none focus:border-accent"
              type="password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={mode === "register" ? 12 : 1}
              required
            />
            {mode === "register" && (
              <span className="mt-1 block text-xs text-ink/50">At least 12 characters.</span>
            )}
          </label>
        )}

        {mode === "reset-confirm" && (
          <>
            <label className="block text-sm">
              <span className="font-medium">Preview token</span>
              <textarea
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 font-mono text-xs outline-none focus:border-accent"
                value={form.token}
                onChange={(event) => update("token", event.target.value)}
                rows={3}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">New password</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper/60 px-3 py-2.5 outline-none focus:border-accent"
                type="password"
                value={form.newPassword}
                onChange={(event) => update("newPassword", event.target.value)}
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="rounded-xl bg-ink/5 px-3 py-2 text-sm text-ink/70">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? "One moment…"
            : mode === "sign-in"
              ? "Sign in"
              : mode === "register"
                ? "Create account"
                : mode === "reset-request"
                  ? "Request reset"
                  : "Set new password"}
        </button>
      </form>

      {mode === "reset-confirm" && (
        <button
          type="button"
          onClick={() => chooseMode("sign-in")}
          className="mt-4 text-sm text-ink/60 underline underline-offset-4 hover:text-ink"
        >
          Back to sign in
        </button>
      )}
    </div>
  );
}
