"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminNotifications({ initialCount }: { initialCount: number }) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [hasNew, setHasNew] = useState(false);
  const previousCount = useRef(initialCount);

  useEffect(() => {
    if (initialCount > previousCount.current) {
      setHasNew(true);
    } else if (initialCount < previousCount.current) {
      setHasNew(false);
    }
    previousCount.current = initialCount;
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let stopped = false;

    async function refreshCount() {
      try {
        const response = await fetch("/api/admin/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (stopped || typeof data.pendingTeachers !== "number") return;

        if (data.pendingTeachers > previousCount.current) {
          setHasNew(true);
        }
        previousCount.current = data.pendingTeachers;
        setCount(data.pendingTeachers);
      } catch {
        // Keep the current notification count until the next refresh.
      }
    }

    const intervalId = window.setInterval(refreshCount, 30000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (count === 0 && !hasNew) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="font-medium text-[var(--foreground)]">
        {hasNew ? "Поступила новая заявка преподавателя." : `Ожидают рассмотрения заявок: ${count}.`}
      </p>
      <button
        type="button"
        onClick={() => {
          setHasNew(false);
          router.refresh();
        }}
        className="self-start rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)] sm:self-auto"
      >
        Обновить список
      </button>
    </div>
  );
}
