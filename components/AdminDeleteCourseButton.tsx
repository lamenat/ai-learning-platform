"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminDeleteCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (
      !window.confirm(
        "Удалить курс и все его уроки, тесты, записи студентов и результаты? Это действие нельзя отменить."
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Не удалось удалить курс");
        return;
      }
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-300 bg-[var(--card)] px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? "Удаляем…" : "Удалить курс"}
      </button>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
