"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NavbarUser = {
  id: string;
  name: string;
  role: string;
} | null;

export default function NavbarClient({ user }: { user: NavbarUser }) {
  const [pendingTeachers, setPendingTeachers] = useState(0);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let stopped = false;

    async function loadPendingCount() {
      try {
        const response = await fetch("/api/admin/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (!stopped && typeof data.pendingTeachers === "number") {
          setPendingTeachers(data.pendingTeachers);
        }
      } catch {
        // Keep the last known count until the next refresh.
      }
    }

    void loadPendingCount();
    const intervalId = window.setInterval(loadPendingCount, 30000);
    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [user?.id, user?.role]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-8 min-w-9 items-center justify-center rounded-lg bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
            ЧПТК
          </span>
          <span className="hidden text-sm sm:inline">Читинский политехнический колледж</span>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-[var(--muted)] md:flex">
          <Link href="/courses" className="transition hover:text-[var(--foreground)]">
            Каталог курсов
          </Link>
          <Link href="/#how-it-works" className="transition hover:text-[var(--foreground)]">
            Как учиться
          </Link>
          {user && (
            <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className="transition hover:text-[var(--foreground)]">
              {user.role === "admin" ? (
                <span className="inline-flex items-center gap-2">
                  Панель администратора
                  {pendingTeachers > 0 && <PendingBadge count={pendingTeachers} />}
                </span>
              ) : "Мой кабинет"}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-[var(--muted)] hidden sm:inline">
                {user.name}
              </span>
              <Link
                href={user.role === "admin" ? "/admin" : "/dashboard"}
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
              >
                {user.role === "admin" ? (
                  <span className="inline-flex items-center gap-2">
                    Админ-панель
                    {pendingTeachers > 0 && <PendingBadge count={pendingTeachers} />}
                  </span>
                ) : "Мой кабинет"}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
              >
                Начать учиться
              </Link>
            </>
          )}
        </div>
      </nav>
      <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto border-t border-[var(--border)] px-6 py-2.5 text-sm text-[var(--muted)] md:hidden">
        <Link href="/courses" className="whitespace-nowrap font-medium text-slate-700">Каталог курсов</Link>
        <Link href="/#how-it-works" className="whitespace-nowrap">Как учиться</Link>
      </div>
    </header>
  );
}

function PendingBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
      {count}
    </span>
  );
}
