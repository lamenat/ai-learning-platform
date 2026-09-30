"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleEnroll() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Не удалось записаться");
        return;
      }

      // Обновить страницу — enrollment появится
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleEnroll}
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-60"
      >
        {loading ? "Записываемся…" : "📝 Записаться на курс"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}