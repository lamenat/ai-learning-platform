import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Status = "gap" | "medium" | "strong";

function statusFor(percent: number): Status {
  if (percent >= 80) return "strong";
  if (percent >= 60) return "medium";
  return "gap";
}

const statusMeta: Record<Status, { label: string; bar: string; badge: string }> = {
  gap: {
    label: "🔴 Пробел",
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  medium: {
    label: "🟡 Средний уровень",
    bar: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  strong: {
    label: "🟢 Сильная тема",
    bar: "bg-green-500",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
};

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Все завершённые попытки студента
  const attempts = await prisma.testAttempt.findMany({
    where: {
      studentId: user.id,
      completedAt: { not: null },
    },
    include: {
      test: {
        include: {
          course: { select: { id: true, title: true } },
        },
      },
    },
  });

  // Группировка по тестам — лучшая попытка
  const byTestMap = new Map<
    string,
    {
      testId: string;
      testTitle: string;
      courseId: string;
      courseTitle: string;
      attemptsCount: number;
      bestScore: number;
      maxScore: number;
    }
  >();

  for (const a of attempts) {
    const existing = byTestMap.get(a.testId);
    if (!existing) {
      byTestMap.set(a.testId, {
        testId: a.testId,
        testTitle: a.test.title,
        courseId: a.test.course.id,
        courseTitle: a.test.course.title,
        attemptsCount: 1,
        bestScore: a.score,
        maxScore: a.maxScore,
      });
    } else {
      existing.attemptsCount += 1;
      existing.bestScore = Math.max(existing.bestScore, a.score);
    }
  }

  // Формируем задачи
  const tasks = Array.from(byTestMap.values()).map((t) => {
    const percent =
      t.maxScore > 0 ? Math.round((t.bestScore / t.maxScore) * 100) : 0;
    return {
      ...t,
      percent,
      status: statusFor(percent) as Status,
    };
  });

  // Сортировка: сначала пробелы, потом средние, потом сильные
  const order: Record<Status, number> = { gap: 0, medium: 1, strong: 2 };
  tasks.sort((a, b) => {
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }
    return a.percent - b.percent;
  });

  const gapCount = tasks.filter((t) => t.status === "gap").length;
  const mediumCount = tasks.filter((t) => t.status === "medium").length;
  const strongCount = tasks.filter((t) => t.status === "strong").length;

  // Задачи «в работу» — пробелы и средние
  const planTasks = tasks.filter(
    (t) => t.status === "gap" || t.status === "medium"
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к дашборду
          </Link>

          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            🎯 Твой план обучения
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Персональные задачи на основе твоих результатов
          </p>

          {tasks.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-12 text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold">План пока пуст</h2>
              <p className="mt-2 text-[var(--muted)]">
                Пройди хотя бы один тест, чтобы получить персональный план
              </p>
              <Link
                href="/courses"
                className="inline-block mt-6 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
              >
                К курсам
              </Link>
            </div>
          ) : planTasks.length === 0 ? (
            /* Есть тесты, но всё в порядке */
            <div className="mt-10 rounded-2xl border border-green-200 bg-green-50 p-12 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-green-800">
                Ты молодец! Всё под контролем
              </h2>
              <p className="mt-2 text-green-700">
                Все тесты сданы на 80% и выше. Продолжай в том же духе!
              </p>
              <Link
                href="/courses"
                className="inline-block mt-6 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
              >
                К курсам
              </Link>
            </div>
          ) : (
            <>
              {/* Сводка */}
              <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6 flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-sm text-[var(--muted)]">
                    Задач в плане
                  </p>
                  <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">
                    {planTasks.length}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {gapCount > 0 && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700">
                      🔴 {gapCount} пробел(ов)
                    </span>
                  )}
                  {mediumCount > 0 && (
                    <span className="rounded-full border border-yellow-200 bg-yellow-50 px-4 py-1.5 text-sm font-medium text-yellow-700">
                      🟡 {mediumCount} на подтяжку
                    </span>
                  )}
                  {strongCount > 0 && (
                    <span className="rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
                      🟢 {strongCount} сильных
                    </span>
                  )}
                </div>
              </section>

              {/* Список задач */}
              <section className="mt-8">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                  Что делать
                </h2>

                <ol className="flex flex-col gap-4">
                  {planTasks.map((task, index) => {
                    const meta = statusMeta[task.status];
                    return (
                      <li
                        key={task.testId}
                        className="rounded-2xl border border-[var(--border)] bg-white p-6"
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white text-lg font-bold">
                            {index + 1}
                          </span>

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                                {task.testTitle}
                              </h3>
                              <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
                              >
                                {meta.label}
                              </span>
                            </div>

                            <p className="mt-1 text-sm text-[var(--muted)]">
                              Курс: {task.courseTitle}
                            </p>

                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[var(--muted)]">
                                  Твой лучший результат
                                </span>
                                <span className="font-semibold text-[var(--foreground)]">
                                  {task.percent}%
                                </span>
                              </div>
                              <div className="mt-2 w-full h-2 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                                <div
                                  className={`h-full ${meta.bar} transition-all`}
                                  style={{ width: `${task.percent}%` }}
                                />
                              </div>
                              <p className="mt-2 text-xs text-[var(--muted)]">
                                {task.bestScore} из {task.maxScore} · пройдено{" "}
                                {task.attemptsCount} раз
                              </p>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                              <Link
                                href={`/courses/${task.courseId}/tests/${task.testId}/take`}
                                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
                              >
                                🚀 Начать
                              </Link>
                              <Link
                                href={`/courses/${task.courseId}/tests/${task.testId}`}
                                className="rounded-lg border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
                              >
                                К тесту
                              </Link>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {/* Сильные темы */}
              {strongCount > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    🟢 Уже сильные темы
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {tasks
                      .filter((t) => t.status === "strong")
                      .map((t) => (
                        <li
                          key={t.testId}
                          className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 flex items-center justify-between"
                        >
                          <span className="text-sm text-[var(--foreground)]">
                            {t.testTitle}
                          </span>
                          <span className="font-semibold text-green-700">
                            {t.percent}%
                          </span>
                        </li>
                      ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}