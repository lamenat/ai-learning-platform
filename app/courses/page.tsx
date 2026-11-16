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
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Начни с того, что интересно</p>
              <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)] md:text-4xl">
                Каталог курсов
              </h1>
              <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
                {courses.length === 0
                  ? "Пока ни одного курса не создано"
                  : `Выбери курс, чтобы посмотреть уроки и начать обучение. Сейчас доступно курсов: ${courses.length}.`}
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

          {courses.length > 0 && (
            <div className="mb-8 grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:grid-cols-3 sm:p-5">
              <GuideStep number="1" title="Выбери тему" text="Нажми на карточку курса, который тебе интересен." />
              <GuideStep number="2" title="Посмотри программу" text="На странице курса открой список уроков." />
              <GuideStep number="3" title="Запишись и начни" text="Нажми «Записаться на курс», затем открой первый урок." />
            </div>
          )}

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
                  className="group flex flex-col rounded-2xl border border-[var(--border)] bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl" aria-hidden="true">📘</span>
                  <h2 className="text-lg font-semibold group-hover:text-[var(--accent)] transition">
                    {course.title}
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[var(--muted)]">
                    {course.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
                    <span>👨‍🏫 {course.teacher.name}</span>
                    <span>
                      📚 {course._count.lessons} · 👥 {course._count.enrollments}
                    </span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                    Посмотреть курс <span aria-hidden="true" className="transition group-hover:translate-x-1">→</span>
                  </span>
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

function GuideStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white/80 p-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{number}</span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
