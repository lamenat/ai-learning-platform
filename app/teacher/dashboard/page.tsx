import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "teacher") redirect("/dashboard");

  // Собираем данные напрямую (без вызова API, чтобы страница была SSR)
  const courses = await prisma.course.findMany({
    where: { teacherId: user.id },
    include: {
      tests: {
        include: {
          questions: true,
          attempts: {
            where: { completedAt: { not: null } },
          },
        },
      },
      enrollments: {
        include: { student: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  const allAttempts = courses.flatMap((c) =>
    c.tests.flatMap((t) =>
      t.attempts.map((a) => ({ ...a, test: t, course: c }))
    )
  );

  const totalScore = allAttempts.reduce((s, a) => s + a.score, 0);
  const totalMax = allAttempts.reduce((s, a) => s + a.maxScore, 0);
  const avgPercent =
    totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const uniqueStudents = new Set<string>();
  for (const c of courses) {
    for (const e of c.enrollments) uniqueStudents.add(e.student.id);
  }

  const testsCount = courses.reduce((s, c) => s + c.tests.length, 0);

  // Разбивка по курсам
  const coursesStats = courses.map((c) => {
    const courseAttempts = allAttempts.filter((a) => a.course.id === c.id);
    const cScore = courseAttempts.reduce((s, a) => s + a.score, 0);
    const cMax = courseAttempts.reduce((s, a) => s + a.maxScore, 0);
    const cAvg = cMax > 0 ? Math.round((cScore / cMax) * 100) : 0;

    const testStats = c.tests.map((t) => {
      const tAttempts = courseAttempts.filter((a) => a.test.id === t.id);
      const tScore = tAttempts.reduce((s, a) => s + a.score, 0);
      const tMax = tAttempts.reduce((s, a) => s + a.maxScore, 0);
      const tAvg = tMax > 0 ? Math.round((tScore / tMax) * 100) : 0;
      return {
        testId: t.id,
        testTitle: t.title,
        avgPercent: tAvg,
        attemptsCount: tAttempts.length,
      };
    });

    const hardest =
      testStats
        .filter((t) => t.attemptsCount > 0)
        .sort((a, b) => a.avgPercent - b.avgPercent)[0] ?? null;

    return {
      courseId: c.id,
      courseTitle: c.title,
      studentsCount: c.enrollments.length,
      testsCount: c.tests.length,
      avgPercent: cAvg,
      hardestTest: hardest,
    };
  });

  // Топ ошибок
  const questionStats = new Map<
    string,
    {
      questionId: string;
      questionText: string;
      testTitle: string;
      wrongCount: number;
      totalCount: number;
    }
  >();

  for (const c of courses) {
    for (const t of c.tests) {
      for (const q of t.questions) {
        const entry = questionStats.get(q.id) ?? {
          questionId: q.id,
          questionText: q.text,
          testTitle: t.title,
          wrongCount: 0,
          totalCount: 0,
        };
        for (const a of t.attempts) {
          entry.totalCount += 1;
          const ans = await prisma.attemptAnswer.findUnique({
            where: {
              attemptId_questionId: {
                attemptId: a.id,
                questionId: q.id,
              },
            },
            include: { answer: { select: { isCorrect: true } } },
          });
          if (ans && !ans.answer.isCorrect) entry.wrongCount += 1;
        }
        questionStats.set(q.id, entry);
      }
    }
  }

  const topMistakes = Array.from(questionStats.values())
    .filter((q) => q.wrongCount > 0)
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 5);

  // Студенты
  const studentMap = new Map<
    string,
    {
      studentId: string;
      studentName: string;
      studentEmail: string;
      coursesCount: number;
      attemptsCount: number;
      score: number;
      maxScore: number;
      lastActivityAt: Date | null;
    }
  >();

  for (const c of courses) {
    for (const e of c.enrollments) {
      const s = e.student;
      const entry = studentMap.get(s.id) ?? {
        studentId: s.id,
        studentName: s.name,
        studentEmail: s.email,
        coursesCount: 0,
        attemptsCount: 0,
        score: 0,
        maxScore: 0,
        lastActivityAt: null as Date | null,
      };
      entry.coursesCount += 1;
      studentMap.set(s.id, entry);
    }
  }

  for (const a of allAttempts) {
    const entry = studentMap.get(a.studentId);
    if (!entry) continue;
    entry.attemptsCount += 1;
    entry.score += a.score;
    entry.maxScore += a.maxScore;
    if (
      !entry.lastActivityAt ||
      (a.completedAt && a.completedAt > entry.lastActivityAt)
    ) {
      entry.lastActivityAt = a.completedAt;
    }
  }

  const students = Array.from(studentMap.values())
    .map((s) => ({
      ...s,
      avgPercent:
        s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0,
    }))
    .sort((a, b) => b.attemptsCount - a.attemptsCount);

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
            👨‍🏫 Дашборд преподавателя
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Как идут дела у твоих студентов и курсов
          </p>

          {courses.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-[var(--border)] bg-white p-12 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-xl font-semibold">У тебя пока нет курсов</h2>
              <p className="mt-2 text-[var(--muted)]">
                Создай первый курс, чтобы увидеть статистику
              </p>
              <Link
                href="/courses/new"
                className="inline-block mt-6 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
              >
                Создать курс
              </Link>
            </div>
          ) : (
            <>
              {/* 4 карточки-сводки */}
              <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard emoji="📚" value={courses.length} label="Курсов" />
                <StatCard emoji="👥" value={uniqueStudents.size} label="Студентов" />
                <StatCard emoji="📝" value={testsCount} label="Тестов" />
                <StatCard
                  emoji="📊"
                  value={`${avgPercent}%`}
                  label="Средний балл"
                />
              </section>

              {/* Разбивка по курсам */}
              <section className="mt-10">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                  📚 Мои курсы
                </h2>

                <div className="flex flex-col gap-4">
                  {coursesStats.map((c) => (
                    <div
                      key={c.courseId}
                      className="rounded-2xl border border-[var(--border)] bg-white p-6"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <Link
                          href={`/courses/${c.courseId}`}
                          className="font-semibold text-lg text-[var(--foreground)] hover:text-[var(--accent)] transition"
                        >
                          {c.courseTitle}
                        </Link>
                        <span
                          className={`text-lg font-bold ${
                            c.avgPercent >= 80
                              ? "text-green-600"
                              : c.avgPercent >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {c.avgPercent}%
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
                        <span>👥 {c.studentsCount} студентов</span>
                        <span>📝 {c.testsCount} тестов</span>
                      </div>

                      <div className="mt-3 w-full h-2 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                        <div
                          className={`h-full ${
                            c.avgPercent >= 80
                              ? "bg-green-500"
                              : c.avgPercent >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${c.avgPercent}%` }}
                        />
                      </div>

                      {c.hardestTest && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
                          <span className="text-red-700">
                            🔴 Самый сложный тест:
                          </span>{" "}
                          <span className="font-medium text-red-800">
                            {c.hardestTest.testTitle}
                          </span>{" "}
                          <span className="text-red-600">
                            ({c.hardestTest.avgPercent}% · {c.hardestTest.attemptsCount} попыток)
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Топ ошибок */}
              {topMistakes.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    ⚠️ Топ ошибок студентов
                  </h2>

                  <div className="rounded-2xl border border-[var(--border)] bg-white divide-y divide-[var(--border)]">
                    {topMistakes.map((m, i) => (
                      <div
                        key={m.questionId}
                        className="flex items-start gap-4 px-6 py-4"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 text-sm font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--foreground)]">
                            {m.questionText}
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Тест: {m.testTitle}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold text-red-600">
                            {m.wrongCount} ошибок
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            из {m.totalCount} попыток
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Список студентов */}
              {students.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                    👥 Мои студенты
                  </h2>

                  <div className="rounded-2xl border border-[var(--border)] bg-white divide-y divide-[var(--border)]">
                    {students.map((s) => (
                      <div
                        key={s.studentId}
                        className="flex items-center gap-4 px-6 py-4"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-bold">
                          {s.studentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[var(--foreground)]">
                            {s.studentName}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {s.studentEmail}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold text-[var(--foreground)]">
                            {s.avgPercent}%
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {s.attemptsCount} попыток · {s.coursesCount} курсов
                          </p>
                        </div>
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

function StatCard({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 text-2xl font-bold text-[var(--foreground)]">
        {value}
      </div>
      <div className="mt-1 text-sm text-[var(--muted)]">{label}</div>
    </div>
  );
}