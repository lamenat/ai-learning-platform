"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Answer = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  points: number;
  answers: Answer[];
};

type Test = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  questions: Question[];
};

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // questionId → answerId
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tests/${testId}`);
        if (!res.ok) {
          router.push(`/courses/${courseId}`);
          return;
        }
        const data = await res.json();
        setTest(data.test);
      } catch {
        setError("Не удалось загрузить тест");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [testId, courseId, router]);

  function selectAnswer(questionId: string, answerId: string) {
    setAnswers({ ...answers, [questionId]: answerId });
  }

  async function handleSubmit() {
    if (!test) return;

    // Проверяем, что все вопросы отвечены
    const unanswered = test.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(
        `Ответьте на все вопросы. Осталось: ${unanswered.length}`
      );
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, answerId]) => ({
          questionId,
          answerId,
        })),
      };

      const res = await fetch(`/api/tests/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось завершить тест");
        return;
      }

      router.push(
        `/courses/${courseId}/tests/${testId}/result/${data.attempt.id}`
      );
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--surface)]">
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
                AI
              </span>
              <span>Learning Platform</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[var(--muted)]">Загрузка теста…</p>
        </main>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--surface)]">
        <header className="border-b border-[var(--border)] bg-white">
          <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
                AI
              </span>
              <span>Learning Platform</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-500">Тест не найден</p>
        </main>
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const total = test.questions.length;
  const allAnswered = answered === total;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <Link
            href={`/courses/${courseId}/tests/${testId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Отмена
          </Link>
          <div className="text-sm text-[var(--muted)]">
            Отвечено: <strong className="text-[var(--foreground)]">{answered}</strong> из {total}
          </div>
        </div>
      </header>

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            {test.title}
          </h1>
          {test.description && (
            <p className="mt-3 text-[var(--muted)]">{test.description}</p>
          )}

          {/* Вопросы */}
          <ol className="mt-10 flex flex-col gap-6">
            {test.questions.map((question, index) => (
              <li
                key={question.id}
                className="rounded-2xl border border-[var(--border)] bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--foreground)]">
                      {question.text}
                    </p>

                    <div className="mt-4 flex flex-col gap-2">
                      {question.answers.map((answer) => {
                        const selected = answers[question.id] === answer.id;
                        return (
                          <label
                            key={answer.id}
                            className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${
                              selected
                                ? "border-[var(--accent)] bg-blue-50"
                                : "border-[var(--border)] bg-white hover:border-[var(--accent)]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={answer.id}
                              checked={selected}
                              onChange={() =>
                                selectAnswer(question.id, answer.id)
                              }
                              className="h-4 w-4 accent-[var(--accent)]"
                            />
                            <span className="text-sm text-[var(--foreground)]">
                              {answer.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {/* Ошибки */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Кнопка завершения */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-6">
            <div className="text-sm text-[var(--muted)]">
              {allAnswered
                ? "Все вопросы отвечены. Можно завершать."
                : `Осталось ответить: ${total - answered}`}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="rounded-lg bg-[var(--accent)] px-8 py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Отправляем…" : "✓ Завершить тест"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}