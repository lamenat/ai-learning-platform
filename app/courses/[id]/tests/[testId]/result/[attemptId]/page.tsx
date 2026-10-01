import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ExplainButton from "@/components/ExplainButton";

export default async function TestResultPage({
  params,
}: {
  params: Promise<{ id: string; testId: string; attemptId: string }>;
}) {
  const { id: courseId, testId, attemptId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          course: { select: { id: true, title: true, teacherId: true } },
          questions: {
            orderBy: { order: "asc" },
            include: {
              answers: { orderBy: { id: "asc" } },
            },
          },
        },
      },
      answers: true,
    },
  });

  if (!attempt || attempt.testId !== testId) {
    notFound();
  }

  const isOwner = attempt.studentId === user.id;
  const isTeacher = attempt.test.course.teacherId === user.id;
  if (!isOwner && !isTeacher) {
    notFound();
  }

  const percent =
    attempt.maxScore > 0
      ? Math.round((attempt.score / attempt.maxScore) * 100)
      : 0;

  let barColor = "bg-red-500";
  let verdict = "Плохо";
  let verdictColor = "text-red-600";
  if (percent >= 80) {
    barColor = "bg-green-500";
    verdict = "Отлично!";
    verdictColor = "text-green-600";
  } else if (percent >= 60) {
    barColor = "bg-yellow-500";
    verdict = "Хорошо";
    verdictColor = "text-yellow-600";
  }

  const history = await prisma.testAttempt.findMany({
    where: {
      testId,
      studentId: attempt.studentId,
      completedAt: { not: null },
    },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      score: true,
      maxScore: true,
      completedAt: true,
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href={`/courses/${courseId}/tests/${testId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к тесту
          </Link>

          {/* Результат */}
          <header className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              Результат теста
            </h1>
            <p className="mt-1 text-[var(--muted)]">{attempt.test.title}</p>

            <div className="mt-8">
              <div className="flex items-baseline justify-between">
                <span className={`text-5xl font-bold ${verdictColor}`}>
                  {percent}%
                </span>
                <span className={`text-lg font-semibold ${verdictColor}`}>
                  {verdict}
                </span>
              </div>

              <div className="mt-3 w-full h-3 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-[var(--muted)]">
                Балл: <strong className="text-[var(--foreground)]">{attempt.score}</strong> из{" "}
                <strong>{attempt.maxScore}</strong>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/courses/${courseId}/tests/${testId}/take`}
                className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
              >
                🔁 Пройти заново
              </Link>
              <Link
                href={`/courses/${courseId}/tests/${testId}`}
                className="rounded-lg border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
              >
                К тесту
              </Link>
            </div>
          </header>

          {/* Разбор вопросов */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Разбор ответов
            </h2>

            <ol className="flex flex-col gap-4">
              {attempt.test.questions.map((question, index) => {
                const givenAnswer = attempt.answers.find(
                  (a) => a.questionId === question.id
                );
                const given = givenAnswer
                  ? question.answers.find((a) => a.id === givenAnswer.answerId)
                  : null;
                const correct = question.answers.find((a) => a.isCorrect);
                const isRight = given?.isCorrect === true;

                return (
                  <li
                    key={question.id}
                    className={`rounded-xl border bg-white p-6 ${
                      isRight ? "border-green-300" : "border-red-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold ${
                          isRight ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {isRight ? "✓" : "✗"}
                      </span>

                      <div className="flex-1">
                        <p className="font-semibold text-[var(--foreground)]">
                          {index + 1}. {question.text}
                        </p>

                        <div className="mt-3 flex flex-col gap-2 text-sm">
                          <div
                            className={`rounded-lg border px-3 py-2 ${
                              isRight
                                ? "border-green-300 bg-green-50"
                                : "border-red-300 bg-red-50"
                            }`}
                          >
                            <span className="text-xs text-[var(--muted)]">
                              Ваш ответ:
                            </span>{" "}
                            <span className="font-medium">
                              {given?.text ?? "— не отвечено —"}
                            </span>
                          </div>

                          {!isRight && correct && (
                            <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2">
                              <span className="text-xs text-[var(--muted)]">
                                Правильный ответ:
                              </span>{" "}
                              <span className="font-medium text-green-800">
                                {correct.text}
                              </span>
                            </div>
                          )}

                          {!isRight && (
                            <ExplainButton
                              questionId={question.id}
                              givenAnswerId={givenAnswer?.answerId ?? null}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* История попыток */}
          {history.length > 1 && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                История попыток
              </h2>

              <div className="rounded-2xl border border-[var(--border)] bg-white divide-y divide-[var(--border)]">
                {history.map((h) => {
                  const hp =
                    h.maxScore > 0
                      ? Math.round((h.score / h.maxScore) * 100)
                      : 0;
                  return (
                    <Link
                      key={h.id}
                      href={`/courses/${courseId}/tests/${testId}/result/${h.id}`}
                      className={`flex items-center justify-between px-6 py-4 hover:bg-[var(--surface)] transition ${
                        h.id === attemptId ? "bg-blue-50" : ""
                      }`}
                    >
                      <span className="text-sm text-[var(--muted)]">
                        {h.completedAt
                          ? new Date(h.completedAt).toLocaleString("ru-RU")
                          : "—"}
                      </span>
                      <span className="font-semibold">
                        {h.score} / {h.maxScore} ({hp}%)
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}