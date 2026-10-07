"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Answer = { text: string; isCorrect: boolean };
type Question = { text: string; answers: Answer[] };

export default function TrainingPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [topic, setTopic] = useState("");
  const [contextInfo, setContextInfo] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  // Ответы пользователя: questionIndex → answerIndex
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  async function loadTraining() {
    setLoading(true);
    setGenerating(true);
    setError("");
    setSelected({});
    setSubmitted(false);
    setScore(0);

    try {
      const res = await fetch("/api/ai/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось загрузить тренировку");
        setQuestions([]);
        return;
      }

      setTopic(data.topic);
      setContextInfo(data.contextInfo);
      setQuestions(data.questions);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }

  useEffect(() => {
    loadTraining();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectAnswer(qIndex: number, aIndex: number) {
    if (submitted) return;
    setSelected({ ...selected, [qIndex]: aIndex });
  }

  function handleSubmit() {
    let correct = 0;
    questions.forEach((q, qi) => {
      const chosen = selected[qi];
      if (chosen === undefined) return;
      if (q.answers[chosen]?.isCorrect) correct += 1;
    });
    setScore(correct);
    setSubmitted(true);
  }

  const answeredCount = Object.keys(selected).length;
  const allAnswered = answeredCount === questions.length && questions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard/plan"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к плану
          </Link>
          <span className="text-sm text-[var(--muted)]">
            🤖 AI-тренажёр
          </span>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            🤖 Тренировка по пробелам
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            AI сгенерировал новые вопросы по теме твоего пробела
          </p>

          {loading && (
            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-12 text-center">
              <div className="text-5xl mb-4 animate-pulse">🤖</div>
              <p className="text-[var(--muted)]">
                AI готовит тренировочные вопросы…
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <div className="text-4xl mb-3">😔</div>
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={loadTraining}
                disabled={generating}
                className="mt-4 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
              >
                🔁 Попробовать снова
              </button>
            </div>
          )}

          {!loading && !error && questions.length > 0 && (
            <>
              {/* Тема */}
              <div className="mt-8 rounded-2xl border border-purple-200 bg-purple-50 p-5">
                <p className="text-xs text-purple-600 uppercase font-semibold tracking-wide">
                  Тема тренировки
                </p>
                <p className="mt-1 text-lg font-semibold text-purple-900">
                  {topic}
                </p>
                <p className="mt-1 text-sm text-purple-700">{contextInfo}</p>
              </div>

              {/* Прогресс */}
              <div className="mt-6 flex items-center justify-between text-sm text-[var(--muted)]">
                <span>
                  Отвечено:{" "}
                  <strong className="text-[var(--foreground)]">
                    {answeredCount}
                  </strong>{" "}
                  из {questions.length}
                </span>
                {submitted && (
                  <span className="font-semibold text-[var(--foreground)]">
                    Результат: {score} из {questions.length}
                  </span>
                )}
              </div>

              {/* Вопросы */}
              <ol className="mt-4 flex flex-col gap-6">
                {questions.map((q, qi) => {
                  const chosen = selected[qi];
                  const isCorrectChosen =
                    chosen !== undefined && q.answers[chosen]?.isCorrect;
                  const correctIndex = q.answers.findIndex((a) => a.isCorrect);

                  return (
                    <li
                      key={qi}
                      className={`rounded-2xl border bg-white p-6 ${
                        submitted
                          ? isCorrectChosen
                            ? "border-green-300"
                            : "border-red-300"
                          : "border-[var(--border)]"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold ${
                            submitted
                              ? isCorrectChosen
                                ? "bg-green-500"
                                : "bg-red-500"
                              : "bg-[var(--accent)]"
                          }`}
                        >
                          {submitted ? (isCorrectChosen ? "✓" : "✗") : qi + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-[var(--foreground)]">
                            {q.text}
                          </p>

                          <div className="mt-4 flex flex-col gap-2">
                            {q.answers.map((a, ai) => {
                              const isSelected = chosen === ai;
                              const isCorrect = ai === correctIndex;

                              let cls =
                                "border-[var(--border)] bg-white hover:border-[var(--accent)]";

                              if (submitted) {
                                if (isCorrect) {
                                  cls = "border-green-400 bg-green-50";
                                } else if (isSelected) {
                                  cls = "border-red-400 bg-red-50";
                                } else {
                                  cls =
                                    "border-[var(--border)] bg-[var(--surface)]";
                                }
                              } else if (isSelected) {
                                cls = "border-[var(--accent)] bg-blue-50";
                              }

                              return (
                                <label
                                  key={ai}
                                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${cls} ${
                                    submitted ? "" : "cursor-pointer"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`q-${qi}`}
                                    checked={isSelected}
                                    onChange={() => selectAnswer(qi, ai)}
                                    disabled={submitted}
                                    className="h-4 w-4 accent-[var(--accent)]"
                                  />
                                  <span className="text-sm text-[var(--foreground)]">
                                    {a.text}
                                  </span>
                                  {submitted && isCorrect && (
                                    <span className="ml-auto text-xs font-semibold text-green-700">
                                      ✓ Правильный
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Кнопки */}
              <div className="mt-8 flex flex-wrap gap-3 items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-6">
                {!submitted ? (
                  <>
                    <p className="text-sm text-[var(--muted)]">
                      {allAnswered
                        ? "Готово! Можно проверить ответы."
                        : `Осталось: ${questions.length - answeredCount}`}
                    </p>
                    <button
                      onClick={handleSubmit}
                      disabled={!allAnswered}
                      className="rounded-lg bg-[var(--accent)] px-8 py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      ✓ Проверить
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-[var(--muted)]">Результат</p>
                      <p className="text-2xl font-bold text-[var(--foreground)]">
                        {score} из {questions.length}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={loadTraining}
                        disabled={generating}
                        className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 transition disabled:opacity-60"
                      >
                        {generating ? "🤖 Генерирую…" : "🔁 Новая тренировка"}
                      </button>
                      <Link
                        href="/dashboard/plan"
                        className="rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
                      >
                        К плану
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}