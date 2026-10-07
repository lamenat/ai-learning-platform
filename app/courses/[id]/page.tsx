import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnrollButton from "@/components/EnrollButton";
import DeleteCourseButton from "@/components/DeleteCourseButton";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: {
        select: { id: true, name: true, email: true },
      },
      lessons: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  });
  const tests = await prisma.test.findMany({
  where: { courseId: id },
  orderBy: { createdAt: "desc" },
  include: {
    _count: { select: { questions: true, attempts: true } },
  },
});

  if (!course) {
    notFound();
  }

  const isTeacher = user?.role === "teacher";
  const isAuthor = user?.id === course.teacherId;

  // Проверяем, записан ли текущий пользователь
  const enrollment = user
    ? await prisma.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: user.id,
            courseId: course.id,
          },
        },
      })
    : null;

  const isEnrolled = Boolean(enrollment);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/courses"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к курсам
          </Link>

          {/* Заголовок курса */}
          <header className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
              {course.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
              <span>👨‍🏫 {course.teacher.name}</span>
              <span>📚 {course.lessons.length} уроков</span>
              <span>👥 {course._count.enrollments} студентов</span>
            </div>

            <p className="mt-6 text-[var(--foreground)] whitespace-pre-line leading-relaxed">
              {course.description}
            </p>

            {/* Кнопки действий */}
            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthor && (
                <Link
                  href={`/courses/${course.id}/edit`}
                  className="rounded-lg border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition"
                >
                  ✏️ Редактировать
                </Link>
              )}

              {isAuthor && <DeleteCourseButton courseId={course.id} />}

              {user && !isTeacher && !isEnrolled && (
                <EnrollButton courseId={course.id} />
              )}

              {user && !isTeacher && isEnrolled && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-2.5 text-sm font-medium text-green-700">
                  ✅ Вы записаны на курс
                </div>
              )}

              {!user && (
                <Link
                  href="/login"
                  className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
                >
                  Войти, чтобы записаться
                </Link>
              )}
            </div>
          </header>

          {/* Уроки */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                Уроки
              </h2>
              {isAuthor && (
                <Link
                  href={`/courses/${course.id}/lessons/new`}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
                >
                  + Добавить урок
                </Link>
              )}
            </div>

            {course.lessons.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-[var(--muted)]">
                  {isAuthor
                    ? "В курсе пока нет уроков. Добавь первый!"
                    : "Преподаватель ещё не добавил уроки"}
                </p>
              </div>
            ) : (
              <ol className="flex flex-col gap-3">
                {course.lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={`/courses/${course.id}/lessons/${lesson.id}`}
                      className="group rounded-xl border border-[var(--border)] bg-white p-5 flex items-start gap-4 hover:shadow-md hover:border-[var(--accent)] transition"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-sm font-bold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition">
                          {lesson.title}
                        </h3>
                        {lesson.content && (
                          <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                            {lesson.content}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
              </ol>
            )}
          </section>
          {/* Тесты */}
<section className="mt-10">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-2xl font-bold text-[var(--foreground)]">
      Тесты
    </h2>
    {isAuthor && (
      <Link
        href={`/courses/${course.id}/tests/new`}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
      >
        + Создать тест
      </Link>
    )}
  </div>

  {tests.length === 0 ? (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-10 text-center">
      <div className="text-4xl mb-3">📝</div>
      <p className="text-[var(--muted)]">
        {isAuthor
          ? "В курсе пока нет тестов. Создай первый!"
          : "Преподаватель ещё не добавил тесты"}
      </p>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      {tests.map((test) => (
        <Link
          key={test.id}
          href={`/courses/${course.id}/tests/${test.id}`}
          className="group rounded-xl border border-[var(--border)] bg-white p-5 hover:shadow-md hover:border-[var(--accent)] transition flex items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition">
              {test.title}
            </h3>
            {test.description && (
              <p className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                {test.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-xs text-[var(--muted)]">
            <span>📝 {test._count.questions} вопросов</span>
            <span>👥 {test._count.attempts} попыток</span>
          </div>
        </Link>
      ))}
    </div>
  )}
</section>
        </div>
      </main>

      <Footer />
    </div>
  );
}