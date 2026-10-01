"use client";

import { useState } from "react";

export default function ExplainButton({
  questionId,
  givenAnswerId,
}: {
  questionId: string;
  givenAnswerId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  async function handleExplain() {
    if (explanation) {
      setOpen(!open);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, givenAnswerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось получить объяснение");
        return;
      }
      setExplanation(data.explanation);
      setOpen(true);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleExplain}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition disabled:opacity-60"
      >
        {loading ? "🤖 Думаю…" : explanation ? (open ? "🙈 Скрыть" : "🤖 Показать объяснение") : "🤖 Объясни ошибку"}
      </button>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {open && explanation && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-[var(--foreground)] whitespace-pre-line leading-relaxed">
          {explanation}
        </div>
      )}
    </div>
  );
}