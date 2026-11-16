"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

type LessonDraft = { title: string; content: string };

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseIdea, setCourseIdea] = useState("");
  const [generatedLessons, setGeneratedLessons] = useState<LessonDraft[]>([]);
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    lessons?: string;
  }>({});
  const [serverError, setServerError] = useState("");
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleGenerateCourse() {
    setAiError("");
    if (courseIdea.trim().length < 10) {
      setAiError("Опиши идею курса хотя бы в 10 символах.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: courseIdea }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || "Не удалось сгенерировать курс.");
        return;
      }

      setTitle(data.title);
      setDescription(data.description);
      setGeneratedLessons(data.lessons);
      setErrors({});
    } catch {
      setAiError("Не удалось связаться с сервером. Попробуй ещё раз.");
    } finally {
      setGenerating(false);
    }
  }

  function updateLesson(index: number, field: keyof LessonDraft, value: string) {
    setGeneratedLessons((lessons) =>
      lessons.map((lesson, lessonIndex) =>
        lessonIndex === index ? { ...lesson, [field]: value } : lesson
      )
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const next: typeof errors = {};
    if (title.trim().length < 3) next.title = "Минимум 3 символа";
    if (description.trim().length < 10) next.description = "Минимум 10 символов";
    if (
      generatedLessons.some(
        (lesson) =>
          lesson.title.trim().length < 3 || lesson.content.trim().length < 20
      )
    ) {
      next.lessons = "В каждом уроке должны быть название и материал не короче 20 символов.";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, lessons: generatedLessons }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setServerError(data.error || "Не удалось создать курс");
        return;
      }

      router.push(`/courses/${data.course.id}`);
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
            href="/courses"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к курсам
          </Link>

          <h1 className="mt-4 text-3xl font-bold">Создать курс</h1>
          <p className="mt-2 text-[var(--muted)]">
            Заполни курс вручную или попроси AI подготовить черновик по твоему описанию. Перед созданием всё можно изменить.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 flex flex-col gap-5"
          >
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="mb-4">
                <h2 className="font-semibold text-[var(--foreground)]">Сгенерировать курс по описанию</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Расскажи, чему должен научиться студент. AI предложит название, описание и материалы для первых уроков.
                </p>
              </div>
              <Textarea
                id="course-idea"
                label="Твоя идея курса"
                placeholder="Например: курс для студентов первого курса о безопасной работе с ручным электроинструментом. Нужны основы, средства защиты, подготовка рабочего места и практические задания."
                value={courseIdea}
                onChange={(e) => setCourseIdea(e.target.value)}
                rows={4}
              />
              {aiError && (
                <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {aiError}
                </p>
              )}
              <button
                type="button"
                onClick={handleGenerateCourse}
                disabled={generating || loading}
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? "Готовлю план курса…" : generatedLessons.length ? "Сгенерировать заново" : "Сгенерировать черновик"}
              </button>
              <p aria-live="polite" className="mt-2 text-xs text-[var(--muted)]">
                Черновик можно проверить и отредактировать перед сохранением.
              </p>
            </section>

            <Input
              id="title"
              label="Название курса"
              type="text"
              placeholder="Например: Основы Python"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />

            <Textarea
              id="description"
              label="Описание"
              placeholder="Расскажи, чему научится студент на этом курсе…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              rows={6}
            />

            {generatedLessons.length > 0 && (
              <section className="rounded-xl border border-[var(--border)] p-5">
                <div className="mb-4">
                  <h2 className="font-semibold text-[var(--foreground)]">План уроков · {generatedLessons.length}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">Проверь названия и учебные материалы. Всё, что здесь останется, попадёт в курс.</p>
                </div>
                {errors.lessons && (
                  <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errors.lessons}
                  </p>
                )}
                <ol className="flex flex-col gap-5">
                  {generatedLessons.map((lesson, index) => (
                    <li key={index} className="rounded-xl bg-[var(--surface)] p-4">
                      <Input
                        id={`lesson-title-${index}`}
                        label={`Урок ${index + 1}`}
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(index, "title", e.target.value)}
                      />
                      <div className="mt-4">
                        <Textarea
                          id={`lesson-content-${index}`}
                          label="Материал урока"
                          value={lesson.content}
                          onChange={(e) => updateLesson(index, "content", e.target.value)}
                          rows={7}
                        />
                      </div>
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
                {loading ? "Создаём…" : "Создать курс"}
              </button>
              <Link
                href="/courses"
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
