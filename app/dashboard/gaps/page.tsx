import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import KnowledgeDonut from "@/components/KnowledgeDonut";
import KnowledgeCard from "@/components/KnowledgeCard";

type Status = "strong" | "medium" | "gap";

function statusFor(percent: number): Status {
  if (percent >= 80) return "strong";
  if (percent >= 60) return "medium";
  return "gap";
}

// Безопасный процент: не больше 100 и не меньше 0
function safePercent(score: number, maxScore: number): number {
  if (!maxScore || maxScore <= 0) return 0;
  const p = Math.round((score / maxScore) * 100);
  return Math.min(100, Math.max(0, p));
}

export default async function GapsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const attempts = await prisma.testAttempt.findMany({
    where: {
      studentId: user.id,
      completedAt: { not: null },
    },
    include: {
      test: {
        include: {
          course: { select: { id: true, title: true } },
          // считаем реальное число баллов теста — надёжнее, чем maxScore в попытке
          questions: { select: { points: true } },
        },
      },
    },
  });

  // Лучшая попытка по каждому тесту
  const byTestMap = new Map<
    string,
    {
      testId: string;
      testTitle: string;
      courseId: string;
      courseTitle: string;
      bestScore: number;
      maxScore: number; // считаем по questions.points, а не из попытки
    }
  >();

  for (const a of attempts) {
    // Истинный максимум — сумма points у вопросов теста
    const trueMaxScore =
      a.test.questions.reduce((s, q) => s + q.points, 0) || a.maxScore;

    const existing = byTestMap.get(a.testId);
    if (!existing) {
      byTestMap.set(a.testId, {
        testId: a.testId,
        testTitle: a.test.title,
        courseId: a.test.course.id,
        courseTitle: a.test.course.title,
        bestScore: a.score,
        maxScore: trueMaxScore,
      });
    } else {
      existing.bestScore = Math.max(existing.bestScore, a.score);
      existing.maxScore = Math.max(existing.maxScore, trueMaxScore);
    }
  }

  const tests = Array.from(byTestMap.values()).map((t) => {
    const percent = safePercent(t.bestScore, t.maxScore);
    return {
      ...t,
      percent,
      status: statusFor(percent) as Status,
    };
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

  const courses = Array.from(byCourseMap.values()).map((c) => ({
    ...c,
    percent: safePercent(c.score, c.maxScore),
  }));

  const strongCount = tests.filter((t) => t.status === "strong").length;
  const mediumCount = tests.filter((t) => t.status === "medium").length;
  const gapCount = tests.filter((t) => t.status === "gap").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl px-6 py-12">
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
            Визуальная карта твоих сильных тем и пробелов
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
              {/* Круговая диаграмма + легенда */}
              <section className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="flex justify-center">
                    <KnowledgeDonut
                      slices={[
                        { label: "Сильные", value: strongCount, color: "#22c55e" },
                        { label: "Средние", value: mediumCount, color: "#eab308" },
                        { label: "Пробелы", value: gapCount, color: "#ef4444" },
                      ]}
                      size={200}
                      thickness={30}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <LegendRow
                      color="#22c55e"
                      label="🟢 Сильные темы"
                      count={strongCount}
                      desc="80% и выше"
                    />
                    <LegendRow
                      color="#eab308"
                      label="🟡 Средний уровень"
                      count={mediumCount}
                      desc="60–79%"
                    />
                    <LegendRow
                      color="#ef4444"
                      label="🔴 Пробелы"
                      count={gapCount}
                      desc="ниже 60%"
                    />
                  </div>
                </div>
              </section>

              {/* Разбивка по курсам */}
              <section className="mt-10">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                  📚 По курсам
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {courses.map((c) => (
                    <KnowledgeCard
                      key={c.courseId}
                      courseId={c.courseId}
                      courseTitle={c.courseTitle}
                      percent={c.percent}
                      tests={c.tests}
                    />
                  ))}
                </div>
              </section>

              {/* Что подтянуть */}
              {gapCount > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    🔴 Что стоит подтянуть
                  </h2>
                  <div className="flex flex-col gap-3">
                    {tests
                      .filter((t) => t.status === "gap")
                      .map((t) => (
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
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LegendRow({
  color,
  label,
  count,
  desc,
}: {
  color: string;
  label: string;
  count: number;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-4 w-4 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <div className="font-medium text-[var(--foreground)]">{label}</div>
        <div className="text-xs text-[var(--muted)]">{desc}</div>
      </div>
      <span className="text-2xl font-bold text-[var(--foreground)]">
        {count}
      </span>
    </div>
  );
}