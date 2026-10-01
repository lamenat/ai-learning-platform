"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GeneratedAnswer = { text: string; isCorrect: boolean };
type GeneratedQuestion = { text: string; answers: GeneratedAnswer[] };

export default function GenerateQuestionsButton({
  testId,
}: {
  testId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  async function handleGenerate() {
    setError("");
    setQuestions([]);
    if (topic.trim().length < 3) {
      setError("Укажите тему (минимум 3 символа)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось сгенерировать");
        return;
      }
      setQuestions(data.questions);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  function updateQuestionText(index: number, text: string) {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, text } : q))
    );
  }

  function updateAnswerText(qIndex: number, aIndex: number, text: string) {
    setQuestions(
      questions.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              answers: q.answers.map((a, j) =>
                j === aIndex ? { ...a, text } : a
              ),
            }
          : q
      )
    );
  }

  function setCorrect(qIndex: number, aIndex: number) {
    setQuestions(
      questions.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              answers: q.answers.map((a, j) => ({
                ...a,
                isCorrect: j === aIndex,
              })),
            }
          : q
      )
    );
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  async function handleSaveAll() {
    setSaving(true);
    setError("");
    try {
      for (const q of questions) {
        if (!q.answers.some((a) => a.isCorrect)) {
          setError("В каждом вопросе должен быть правильный ответ");
          setSaving(false);
          return;
        }
        const res = await fetch(`/api/tests/${testId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: q.text,
            points: 1,
            answers: q.answers,
          }),
        });
        if (!res.ok) {
          setError("Не удалось сохранить вопрос");
          setSaving(false);
          return;
        }
      }
      setOpen(false);
      setQuestions([]);
      setTopic("");
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-purple-300 bg-purple-50 px-5 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition"
      >
        🤖 Сгенерировать вопросы
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">🤖 AI-генерация вопросов</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-[var(--muted)] hover:text-[var(--foreground)] text-xl"
          >
            ✕
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Тема</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Основы Python: переменные, типы данных, условия"
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Количество вопросов (1–5)
              </label>
              <input
                type="number"
                value={count}
                min={1}
                max={5}
                onChange={(e) => setCount(parseInt(e.target.value) || 3)}
                className="w-32 rounded-lg border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition disabled:opacity-60"
              >
                {loading ? "🤖 Генерирую…" : "✨ Сгенерировать"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto pr-2">
            <p className="text-sm text-[var(--muted)]">
              AI сгенерировал {questions.length} вопрос(ов). Проверь и сохрани.
            </p>

            {questions.map((q, qi) => (
              <div
                key={qi}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white text-xs font-bold">
                    {qi + 1}
                  </span>
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => updateQuestionText(qi, e.target.value)}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    onClick={() => removeQuestion(qi)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 ml-10 flex flex-col gap-2">
                  {q.answers.map((a, ai) => (
                    <div key={ai} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={a.isCorrect}
                        onChange={() => setCorrect(qi, ai)}
                        className="accent-green-600"
                      />
                      <input
                        type="text"
                        value={a.text}
                        onChange={(e) =>
                          updateAnswerText(qi, ai, e.target.value)
                        }
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none ${
                          a.isCorrect
                            ? "border-green-300 bg-green-50"
                            : "border-[var(--border)] bg-white"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2 sticky bottom-0 bg-white pb-2">
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
              >
                {saving ? "Сохраняю…" : "💾 Сохранить все"}
              </button>
              <button
                onClick={() => {
                  setQuestions([]);
                  setError("");
                }}
                disabled={saving}
                className="rounded-lg border border-purple-300 bg-purple-50 px-6 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition"
              >
                🔁 Сгенерировать заново
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}