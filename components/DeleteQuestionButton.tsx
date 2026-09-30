"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteTestButton({
  courseId,
  testId,
}: {
  courseId: string;
  testId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm("Удалить тест? Все вопросы и попытки студентов будут удалены.")) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tests/${testId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Не удалось удалить");
        return;
      }
      router.push(`/courses/${courseId}`);
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-60"
      >
        {loading ? "Удаляем…" : "🗑 Удалить тест"}
      </button>
      {error && (
        <span className="text-xs text-red-500 self-center">{error}</span>
      )}
    </>
  );
}