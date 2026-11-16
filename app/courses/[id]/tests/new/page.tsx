"use client";

import { FormEvent, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

type AnswerDraft = { text: string; isCorrect: boolean };
type QuestionDraft = { text: string; answers: AnswerDraft[] };

export default function NewTestPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testIdea, setTestIdea] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionDraft[]>([]);
  const [errors, setErrors] = useState<{ title?: string; questions?: string }>({});
  const [serverError, setServerError] = useState("");
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleGenerateTest() {
    setAiError("");
    if (testIdea.trim().length < 10) {
      setAiError("Опиши, что нужно проверить, хотя бы в 10 символах.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, description: testIdea }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || "Не удалось сгенерировать тест.");
        return;
      }

      setTitle(data.title);
      setDescription(data.description);
      setGeneratedQuestions(data.questions);
      setErrors({});
    } catch {
      setAiError("Не удалось связаться с сервером. Попробуй ещё раз.");
    } finally {
      setGenerating(false);
    }
  }

  function updateQuestionText(index: number, text: string) {
    setGeneratedQuestions((questions) =>
      questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, text } : question
      )
    );
  }

  function updateAnswerText(questionIndex: number, answerIndex: number, text: string) {
    setGeneratedQuestions((questions) =>
      questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              answers: question.answers.map((answer, optionIndex) =>
                optionIndex === answerIndex ? { ...answer, text } : answer
              ),
            }
          : question
      )
    );
  }

  function setCorrectAnswer(questionIndex: number, answerIndex: number) {
    setGeneratedQuestions((questions) =>
      questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              answers: question.answers.map((answer, optionIndex) => ({
                ...answer,
                isCorrect: optionIndex === answerIndex,
              })),
            }
          : question
      )
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});

    if (title.trim().length < 3) {
      setErrors({ title: "Минимум 3 символа" });
      return;
    }
    if (
      generatedQuestions.some(
        (question) =>
          question.text.trim().length < 3 ||
          question.answers.length < 2 ||
          question.answers.length > 6 ||
          question.answers.some((answer) => !answer.text.trim()) ||
          question.answers.filter((answer) => answer.isCorrect).length !== 1
      )
    ) {
      setErrors({ questions: "Проверь вопросы: у каждого должен быть текст и ровно один правильный ответ." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          ...(generatedQuestions.length > 0 ? { questions: generatedQuestions } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setServerError(data.error || "Не удалось создать тест");
        return;
      }

      router.push(`/courses/${courseId}/tests/${data.test.id}`);
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
              ЧПТК
            </span>
            <span>Учебная платформа ЧПТК</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <Link
            href={`/courses/${courseId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к курсу
          </Link>

          <h1 className="mt-4 text-3xl font-bold">Создать тест</h1>
          <p className="mt-2 text-[var(--muted)]">
            Заполни информацию вручную или попроси AI подготовить тест по твоему описанию. Перед сохранением всё можно изменить.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 flex flex-col gap-5"
          >
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="mb-4">
                <h2 className="font-semibold text-[var(--foreground)]">Сгенерировать тест по описанию</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Укажи тему и знания, которые нужно проверить. AI подготовит название, описание и вопросы по этому курсу.
                </p>
              </div>
              <Textarea
                id="test-idea"
                label="Что проверить в тесте"
                placeholder="Например: проверь понимание правил безопасной работы с электроинструментом, выбор средств защиты и порядок осмотра инструмента перед началом работы."
                value={testIdea}
                onChange={(e) => setTestIdea(e.target.value)}
                rows={4}
              />
              {aiError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {aiError}
                </p>
              )}
              <button
                type="button"
                onClick={handleGenerateTest}
                disabled={generating || loading}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Готовлю вопросы…" : generatedQuestions.length ? "Сгенерировать заново" : "Сгенерировать черновик"}
              </button>
              <p aria-live="polite" className="mt-2 text-xs text-[var(--muted)]">
                Проверь правильные ответы. Черновик можно отредактировать перед сохранением.
              </p>
            </section>

            <Input
              id="title"
              label="Название теста"
              type="text"
              placeholder="Например: Проверка знаний Python"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />

            <Textarea
              id="description"
              label="Описание (необязательно)"
              placeholder="Что проверяет этот тест?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            {generatedQuestions.length > 0 && (
              <section className="rounded-xl border border-[var(--border)] p-5">
                <div className="mb-4">
                  <h2 className="font-semibold text-[var(--foreground)]">Вопросы · {generatedQuestions.length}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Отметь кружком один правильный ответ в каждом вопросе. Остальные варианты будут считаться неверными.</p>
                </div>
                {errors.questions && (
                  <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errors.questions}
                  </p>
                )}
                <ol className="flex flex-col gap-5">
                  {generatedQuestions.map((question, questionIndex) => (
                    <li key={questionIndex} className="rounded-xl bg-[var(--surface)] p-4">
                      <Textarea
                        id={`question-${questionIndex}`}
                        label={`Вопрос ${questionIndex + 1}`}
                        value={question.text}
                        onChange={(e) => updateQuestionText(questionIndex, e.target.value)}
                        rows={2}
                      />
                      <fieldset className="mt-4 flex flex-col gap-3">
                        <legend className="mb-1 text-sm font-medium text-[var(--foreground)]">Варианты ответа · выбери правильный</legend>
                        {question.answers.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-answer-${questionIndex}`}
                              checked={answer.isCorrect}
                              onChange={() => setCorrectAnswer(questionIndex, answerIndex)}
                              aria-label={`Отметить вариант ${answerIndex + 1} правильным`}
                              className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                            />
                            <input
                              type="text"
                              value={answer.text}
                              onChange={(e) => updateAnswerText(questionIndex, answerIndex, e.target.value)}
                              aria-label={`Текст варианта ${answerIndex + 1}`}
                              className="w-full rounded-lg border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        ))}
                      </fieldset>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || generating}
                className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
              >
                {loading ? "Создаём…" : "Создать тест"}
              </button>
              <Link
                href={`/courses/${courseId}`}
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
