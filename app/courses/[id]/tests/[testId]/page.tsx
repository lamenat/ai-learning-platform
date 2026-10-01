import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeleteTestButton from "@/components/DeleteTestButton";
import DeleteQuestionButton from "@/components/DeleteQuestionButton";
import GenerateQuestionsButton from "@/components/GenerateQuestionsButton";

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string; testId: string }>;
}) {
  const { id: courseId, testId } = await params;
  const user = await getCurrentUser();

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      course: {
        select: { id: true, title: true, teacherId: true },
      },
      questions: {
        orderBy: { order: "asc" },
        include: {
          answers: { orderBy: { id: "asc" } },
        },
      },
      _count: {
        select: { attempts: true },
      },
    },
  });

  if (!test || test.courseId !== courseId) {
    notFound();
  }

  const isAuthor = user?.id === test.course.teacherId;
  const totalPoints = test.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href={`/courses/${courseId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к курсу
          </Link>

          {/* Заголовок теста */}
          <header className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
              {test.title}
            </h1>

            {test.description && (
              <p className="mt-4 text-[var(--foreground)] whitespace-pre-line leading-relaxed">
                {test.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
              <span>📝 {test.questions.length} вопросов</span>
              <span>🎯 {totalPoints} баллов</span>
              <span>👥 {test._count.attempts} попыток</span>
            </div>

            {/* Кнопки действий */}
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthor ? (
                <>
                  <Link
                    href={`/courses/${courseId}/tests/${testId}/questions/new`}
                    className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
                  >
                    + Добавить вопрос
                  </Link>
                  <GenerateQuestionsButton testId={testId} />
                  <Link
                    href={`/courses/${courseId}/tests/${testId}/edit`}
                    className="rounded-lg border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
                  >
                    ✏️ Редактировать
                  </Link>
                  <DeleteTestButton courseId={courseId} testId={testId} />
                </>
              ) : (
                user && (
                  <Link
                    href={`/courses/${courseId}/tests/${testId}/take`}
                    className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
                  >
                    ▶ Пройти тест
                  </Link>
                )
              )}

              {!user && (
                <Link
                  href="/login"
                  className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
                >
                  Войти, чтобы пройти
                </Link>
              )}
            </div>
          </header>

          {/* Список вопросов */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
              Вопросы
            </h2>

            {test.questions.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center">
                <div className="text-4xl mb-3">❓</div>
                <p className="text-[var(--muted)]">
                  {isAuthor
                    ? "В тесте пока нет вопросов. Добавь первый!"
                    : "Преподаватель ещё не добавил вопросы"}
                </p>
              </div>
            ) : (
              <ol className="flex flex-col gap-4">
                {test.questions.map((question, index) => (
                  <li
                    key={question.id}
                    className="rounded-xl border border-[var(--border)] bg-white p-6"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-semibold text-[var(--foreground)] flex-1">
                            {question.text}
                          </p>
                          {isAuthor && (
                            <DeleteQuestionButton questionId={question.id} />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {question.points} балл(ов) за правильный ответ
                        </p>

                        <ul className="mt-4 flex flex-col gap-2">
                          {question.answers.map((answer) => (
                            <li
                              key={answer.id}
                              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                                isAuthor && answer.isCorrect
                                  ? "border-green-300 bg-green-50 text-green-800"
                                  : "border-[var(--border)] bg-[var(--surface)]"
                              }`}
                            >
                              {isAuthor && answer.isCorrect && (
                                <span className="text-green-600 font-bold">✓</span>
                              )}
                              <span>{answer.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}