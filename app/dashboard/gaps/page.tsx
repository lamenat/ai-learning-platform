import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Status = "strong" | "medium" | "gap";

function statusFor(percent: number): Status {
  if (percent >= 80) return "strong";
  if (percent >= 60) return "medium";
  return "gap";
}

const statusMeta: Record<Status, { label: string; color: string; bg: string; bar: string; emoji: string }> = {
  strong: {
    label: "Сильная тема",
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
    bar: "bg-green-500",
    emoji: "🟢",
  },
  medium: {
    label: "Средний уровень",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-200",
    bar: "bg-yellow-500",
    emoji: "🟡",
  },
  gap: {
    label: "Пробел",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    bar: "bg-red-500",
    emoji: "🔴",
  },
};

export default async function GapsPage() {
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

  // Группировка по тестам — берём лучшую попытку
  const byTestMap = new Map<
    string,
    {
      testId: string;
      testTitle: string;
      courseId: string;
      courseTitle: string;
      attempts: number;
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
        attempts: 1,
        bestScore: a.score,
        maxScore: a.maxScore,
      });
    } else {
      existing.attempts += 1;
      existing.bestScore = Math.max(existing.bestScore, a.score);
    }
  }

  const tests = Array.from(byTestMap.values()).map((t) => {
    const percent =
      t.maxScore > 0 ? Math.round((t.bestScore / t.maxScore) * 100) : 0;
    return { ...t, percent, status: statusFor(percent) as Status };
  });

  // Группировка по курсам
  const byCourseMap = new Map<
    string,
    {
      courseId: string;
      courseTitle: string;
      score: number;
      maxScore: number;
      tests: typeof tests;
    }
  >();

  for (const t of tests) {
    const existing = byCourseMap.get(t.courseId);
    if (!existing) {
      byCourseMap.set(t.courseId, {
        courseId: t.courseId,
        courseTitle: t.courseTitle,
        score: t.bestScore,
        maxScore: t.maxScore,
        tests: [t],
      });
    } else {
      existing.score += t.bestScore;
      existing.maxScore += t.maxScore;
      existing.tests.push(t);
    }
  }

  const byCourse = Array.from(byCourseMap.values()).map((c) => ({
    ...c,
    percent:
      c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0,
  }));

  // Общая статистика
  const totalScore = tests.reduce((s, t) => s + t.bestScore, 0);
  const totalMaxScore = tests.reduce((s, t) => s + t.maxScore, 0);
  const overallPercent =
    totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

  const strongCount = tests.filter((t) => t.status === "strong").length;
  const mediumCount = tests.filter((t) => t.status === "medium").length;
  const gapCount = tests.filter((t) => t.status === "gap").length;
  const gaps = tests.filter((t) => t.status === "gap");

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
            🧠 Мои знания
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Анализ твоих результатов по тестам и карта пробелов
          </p>

          {tests.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-xl font-semibold">
                Пока нет данных для анализа
              </h2>
              <p className="mt-2 text-[var(--muted)]">
                Пройди хотя бы один тест, чтобы увидеть свою карту знаний
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
              {/* Общий прогресс */}
              <section className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-8">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm text-[var(--muted)]">
                      Общий результат
                    </p>
                    <p className="mt-1 text-5xl font-bold text-[var(--foreground)]">
                      {overallPercent}%
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {totalScore} из {totalMaxScore} баллов
                  </p>
                </div>

                <div className="mt-4 w-full h-3 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      overallPercent >= 80
                        ? "bg-green-500"
                        : overallPercent >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${overallPercent}%` }}
                  />
                </div>
              </section>

              {/* 3 карточки-сводки */}
              <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                  <div className="text-3xl">🟢</div>
                  <div className="mt-2 text-2xl font-bold text-green-700">
                    {strongCount}
                  </div>
                  <div className="text-sm text-green-700">Сильных тем</div>
                </div>
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                  <div className="text-3xl">🟡</div>
                  <div className="mt-2 text-2xl font-bold text-yellow-700">
                    {mediumCount}
                  </div>
                  <div className="text-sm text-yellow-700">Средний уровень</div>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="text-3xl">🔴</div>
                  <div className="mt-2 text-2xl font-bold text-red-700">
                    {gapCount}
                  </div>
                  <div className="text-sm text-red-700">Пробелов</div>
                </div>
              </section>

              {/* Пробелы в деталях */}
              {gaps.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    🔴 Что стоит подтянуть
                  </h2>
                  <div className="flex flex-col gap-3">
                    {gaps.map((t) => (
                      <div
                        key={t.testId}
                        className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-[var(--foreground)]">
                            {t.testTitle}
                          </p>
                          <p className="text-sm text-[var(--muted)]">
                            {t.courseTitle} · {t.percent}%
                          </p>
                        </div>
                        <Link
                          href={`/courses/${t.courseId}/tests/${t.testId}/take`}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition shrink-0"
                        >
                          Пройти заново
                        </Link>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Разбивка по курсам */}
              <section className="mt-10">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                  📚 По курсам
                </h2>

                <div className="flex flex-col gap-4">
                  {byCourse.map((c) => (
                    <div
                      key={c.courseId}
                      className="rounded-2xl border border-[var(--border)] bg-white p-6"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Link
                            href={`/courses/${c.courseId}`}
                            className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition"
                          >
                            {c.courseTitle}
                          </Link>
                          <p className="text-sm text-[var(--muted)]">
                            {c.score} из {c.maxScore} · {c.percent}%
                          </p>
                        </div>
                        <span
                          className={`text-lg font-bold ${
                            c.percent >= 80
                              ? "text-green-600"
                              : c.percent >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {c.percent}%
                        </span>
                      </div>

                      <div className="mt-3 w-full h-2 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                        <div
                          className={`h-full ${
                            c.percent >= 80
                              ? "bg-green-500"
                              : c.percent >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${c.percent}%` }}
                        />
                      </div>

                      {/* Тесты внутри курса */}
                      <ul className="mt-4 flex flex-col gap-2">
                        {c.tests.map((t) => {
                          const meta = statusMeta[t.status];
                          return (
                            <li
                              key={t.testId}
                              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2 text-sm ${meta.bg}`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{meta.emoji}</span>
                                <span className="text-[var(--foreground)]">
                                  {t.testTitle}
                                </span>
                              </span>
                              <span className={`font-semibold ${meta.color}`}>
                                {t.percent}%
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}