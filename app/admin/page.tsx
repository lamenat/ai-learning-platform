import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminNotifications from "@/components/AdminNotifications";
import AdminDeleteCourseButton from "@/components/AdminDeleteCourseButton";
import TeacherApprovalActions from "@/components/TeacherApprovalActions";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const [pendingTeachers, courses] = await Promise.all([
    prisma.user.findMany({
      where: { role: "teacher", teacherApprovalStatus: "pending" },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { name: true, email: true } },
        _count: { select: { lessons: true, tests: true, enrollments: true } },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 min-w-9 items-center justify-center rounded-lg bg-[var(--accent)] px-1 text-[10px] font-bold text-white">ЧПТК</span>
            <span>Панель администратора</span>
          </Link>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <span className="hidden sm:inline">{user.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Управление платформой</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)] md:text-4xl">Админ-панель</h1>
        <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
          Рассматривай заявки преподавателей и управляй курсами колледжа.
        </p>

        <AdminNotifications initialCount={pendingTeachers.length} />

        <section className="mt-10" aria-labelledby="teacher-requests-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="teacher-requests-heading" className="text-2xl font-bold text-[var(--foreground)]">Заявки преподавателей</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">После одобрения преподаватель сможет создавать и редактировать свои курсы.</p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm font-semibold text-[var(--foreground)]">
              {pendingTeachers.length} ожидают
            </span>
          </div>

          {pendingTeachers.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
              Новых заявок нет.
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {pendingTeachers.map((teacher) => (
                <li key={teacher.id} className="flex flex-col justify-between gap-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{teacher.name}</h3>
                    <a href={`mailto:${teacher.email}`} className="mt-1 inline-block text-sm text-[var(--accent)] hover:underline">{teacher.email}</a>
                    <p className="mt-2 text-xs text-[var(--muted)]">Заявка от {teacher.createdAt.toLocaleDateString("ru-RU")}</p>
                  </div>
                  <TeacherApprovalActions teacherId={teacher.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12" aria-labelledby="courses-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="courses-heading" className="text-2xl font-bold text-[var(--foreground)]">Курсы</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Удаление курса также удалит его уроки, тесты и результаты студентов.</p>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm font-semibold text-[var(--foreground)]">
              {courses.length} всего
            </span>
          </div>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted)]">
              Курсов пока нет.
            </div>
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {courses.map((course) => (
                <li key={course.id} className="flex flex-col justify-between gap-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <Link href={`/courses/${course.id}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)] hover:underline">
                      {course.title}
                    </Link>
                    <p className="mt-1 text-sm text-[var(--muted)]">Автор: {course.teacher.name} · {course.teacher.email}</p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {course._count.lessons} уроков · {course._count.tests} тестов · {course._count.enrollments} студентов
                    </p>
                  </div>
                  <AdminDeleteCourseButton courseId={course.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
