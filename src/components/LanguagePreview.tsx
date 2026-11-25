"use client";

import { useState } from "react";

const phrases = [
  { code: "en", label: "English", text: "I'm here. Take your time.", dir: "ltr" },
  { code: "ar", label: "العربية", text: "أنا هنا. خذ وقتك.", dir: "rtl" },
  { code: "es", label: "Español", text: "Estoy aquí. Toma tu tiempo.", dir: "ltr" },
  { code: "fr", label: "Français", text: "Je suis là. Prenez votre temps.", dir: "ltr" },
  { code: "de", label: "Deutsch", text: "Ich bin hier. Nimm dir Zeit.", dir: "ltr" },
  { code: "zh", label: "中文", text: "我在这里。慢慢来。", dir: "ltr" },
  { code: "hi", label: "हिन्दी", text: "मैं यहाँ हूँ। अपना समय लें।", dir: "ltr" },
  { code: "pt", label: "Português", text: "Estou aqui. Vá com calma.", dir: "ltr" },
] as const;

export function LanguagePreview() {
  const [selected, setSelected] = useState<(typeof phrases)[number]["code"]>("en");
  const phrase = phrases.find((item) => item.code === selected) ?? phrases[0];

  return (
    <div className="rounded-[28px] border border-ink/10 bg-white/60 p-6 shadow-[0_24px_70px_-45px_rgba(18,59,58,0.55)] sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">A first hello</p>
      <p
        className="font-display mt-5 min-h-24 text-3xl leading-snug text-ink sm:text-4xl"
        dir={phrase.dir}
        lang={phrase.code}
      >
        “{phrase.text}”
      </p>
      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Preview a language">
        {phrases.map((item) => (
          <button
            key={item.code}
            type="button"
            aria-pressed={selected === item.code}
            onClick={() => setSelected(item.code)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selected === item.code
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 bg-transparent text-ink/70 hover:border-ink/40 hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="mt-5 text-xs text-ink/50">
        Choose any of these languages when you begin a conversation. The greeting you see here is a
        sample.
      </p>
    </div>
  );
}
