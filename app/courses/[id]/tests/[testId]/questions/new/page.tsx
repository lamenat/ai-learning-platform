"use client";

import { FormEvent, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";
import DeleteTestButton from "@/components/DeleteTestButton";
import DeleteQuestionButton from "@/components/DeleteQuestionButton";

type AnswerDraft = {
  text: string;
  isCorrect: boolean;
};

export default function NewQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const testId = params.testId as string;

  const [text, setText] = useState("");
  const [points, setPoints] = useState(1);
  const [answers, setAnswers] = useState<AnswerDraft[]>([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ]);
  const [errors, setErrors] = useState<{
    text?: string;
    answers?: string;
  }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function addAnswer() {
    if (answers.length >= 6) return;
    setAnswers([...answers, { text: "", isCorrect: false }]);
  }

  function removeAnswer(index: number) {
    if (answers.length <= 2) return;
    setAnswers(answers.filter((_, i) => i !== index));
  }

  function updateAnswer(index: number, field: keyof AnswerDraft, value: string | boolean) {
    setAnswers(
      answers.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const next: typeof errors = {};

    if (text.trim().length < 3) {
      next.text = "Минимум 3 символа";
    }
    if (answers.some((a) => a.text.trim().length === 0)) {
      next.answers = "Все варианты должны содержать текст";
    }
    if (!answers.some((a) => a.isCorrect)) {
      next.answers = "Отметь хотя бы один правильный ответ";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          points,
          answers: answers.map((a) => ({
            text: a.text.trim(),
            isCorrect: a.isCorrect,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setServerError(data.error || "Не удалось добавить вопрос");
        return;
      }

      router.push(`/courses/${courseId}/tests/${testId}`);
      router.refresh();
    } catch {
      setServerError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
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

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <Link
            href={`/courses/${courseId}/tests/${testId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к тесту
          </Link>

          <h1 className="mt-4 text-3xl font-bold">Новый вопрос</h1>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 flex flex-col gap-6"
          >
            <Textarea
              id="text"
              label="Текст вопроса"
              placeholder="Что нужно проверить?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              error={errors.text}
              rows={3}
            />

            <Input
              id="points"
              label="Баллы за правильный ответ"
              type="number"
              min={1}
              max={10}
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
            />

            {/* Варианты ответа */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  Варианты ответа
                </span>
                <button
                  type="button"
                  onClick={addAnswer}
                  disabled={answers.length >= 6}
                  className="text-sm text-[var(--accent)] hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  + Добавить вариант
                </button>
              </div>

              {answers.map((answer, index) => (
                <div key={index} className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={answer.isCorrect}
                      onChange={(e) =>
                        updateAnswer(index, "isCorrect", e.target.checked)
                      }
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    <span className="text-xs text-[var(--muted)] whitespace-nowrap">
                      правильный
                    </span>
                  </label>

                  <input
                    type="text"
                    value={answer.text}
                    onChange={(e) =>
                      updateAnswer(index, "text", e.target.value)
                    }
                    placeholder={`Вариант ${index + 1}`}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100"
                  />

                  <button
                    type="button"
                    onClick={() => removeAnswer(index)}
                    disabled={answers.length <= 2}
                    className="rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Удалить вариант"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {errors.answers && (
                <span className="text-xs text-red-500">{errors.answers}</span>
              )}

              <p className="text-xs text-[var(--muted)]">
                Отметь чекбоксами все правильные варианты. Минимум 2 варианта, максимум 6.
              </p>
            </div>

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
              >
                {loading ? "Добавляем…" : "Добавить вопрос"}
              </button>
              <Link
                href={`/courses/${courseId}/tests/${testId}`}
                className="rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}