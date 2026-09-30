"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError("");
    setErrors({});

    const next: typeof errors = {};
    if (title.trim().length < 3) next.title = "Минимум 3 символа";
    if (description.trim().length < 10) next.description = "Минимум 10 символов";
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
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
        AI
      </span>
      <span>Learning Platform</span>
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
            Заполни основную информацию. Уроки добавишь после создания.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 flex flex-col gap-5"
          >
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