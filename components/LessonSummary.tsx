"use client";

import { useState } from "react";

export default function LessonSummary({ lessonId }: { lessonId: string }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function handleSummary() {
    if (summary) {
      setOpen(!open);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/lesson-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось создать резюме");
        return;
      }
      setSummary(data.summary);
      setOpen(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-purple-800">
            📝 AI-резюме урока
          </h3>
          <p className="text-xs text-purple-600 mt-1">
            Короткий конспект ключевых тезисов
          </p>
        </div>
        <button
          onClick={handleSummary}
          disabled={loading}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition disabled:opacity-60 shrink-0"
        >
          {loading
            ? "🤖 Думаю…"
            : summary
            ? open
              ? "🙈 Скрыть"
              : "👁 Показать"
            : "✨ Создать резюме"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {open && summary && (
        <div className="mt-4 rounded-xl border border-purple-200 bg-white p-4 text-sm text-[var(--foreground)] whitespace-pre-line leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}