"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import Input from "@/components/Input";
import Textarea from "@/components/Textarea";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [serverError, setServerError] = useState("");

  // Загрузка курса
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/courses/${courseId}`);
        if (!res.ok) {
          router.push("/courses");
          return;
        }
        const data = await res.json();
        setTitle(data.course.title);
        setDescription(data.course.description);
      } catch {
        setServerError("Не удалось загрузить курс");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, router]);

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

    setSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setServerError(data.error || "Не удалось сохранить");
        return;
      }

      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch {
      setServerError("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Удалить курс? Все уроки и записи студентов будут удалены.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error || "Не удалось удалить");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setServerError("Ошибка сети");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
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
        <main className="flex-1 flex items-center justify-center bg-[var(--surface)]">
          <p className="text-[var(--muted)]">Загрузка…</p>
        </main>
      </div>
    );
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
            href={`/courses/${courseId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к курсу
          </Link>

          <h1 className="mt-4 text-3xl font-bold">Редактировать курс</h1>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8 flex flex-col gap-5"
          >
            <Input
              id="title"
              label="Название курса"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />

            <Textarea
              id="description"
              label="Описание"
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

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
              >
                {saving ? "Сохраняем…" : "Сохранить"}
              </button>
              <Link
                href={`/courses/${courseId}`}
                className="rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
              >
                Отмена
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="ml-auto rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-60"
              >
                {deleting ? "Удаляем…" : "🗑 Удалить курс"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}