"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherApprovalActions({ teacherId }: { teacherId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState("");

  async function decide(status: "approved" | "rejected") {
    setLoading(status);
    setError("");
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Не удалось сохранить решение");
        return;
      }
      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={loading !== null}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
        >
          {loading === "approved" ? "Одобряем…" : "Одобрить"}
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={loading !== null}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)] disabled:opacity-60"
        >
          {loading === "rejected" ? "Отклоняем…" : "Отклонить"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
