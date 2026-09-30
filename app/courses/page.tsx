import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function CoursesPage() {
  const user = await getCurrentUser();

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { id: true, name: true } },
      _count: { select: { lessons: true, enrollments: true } },
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)]">
                Курсы
              </h1>
              <p className="mt-2 text-[var(--muted)]">
                {courses.length === 0
                  ? "Пока ни одного курса не создано"
                  : `Всего курсов: ${courses.length}`}
              </p>
            </div>

            {user?.role === "teacher" && (
              <Link
                href="/courses/new"
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
              >
                + Создать курс
              </Link>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-12 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-xl font-semibold">Курсов пока нет</h2>
              <p className="mt-2 text-[var(--muted)]">
                {user?.role === "teacher"
                  ? "Создай первый курс и начни привлекать студентов"
                  : "Скоро здесь появятся курсы от преподавателей"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="group rounded-2xl border border-[var(--border)] bg-white p-6 hover:shadow-lg hover:border-[var(--accent)] transition flex flex-col"
                >
                  <h2 className="text-lg font-semibold group-hover:text-[var(--accent)] transition">
                    {course.title}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)] line-clamp-3 flex-1">
                    {course.description}
                  </p>
                  <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>👨‍🏫 {course.teacher.name}</span>
                    <span>
                      📚 {course._count.lessons} · 👥 {course._count.enrollments}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}