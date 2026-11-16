import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  const isTeacher = user.role === "teacher";

  // Для преподавателя — его курсы; для студента — куда записан
  const courses = isTeacher
    ? await prisma.course.findMany({
        where: { teacherId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
      })
    : await prisma.course.findMany({
        where: {
          enrollments: { some: { studentId: user.id } },
        },
        orderBy: { createdAt: "desc" },
        include: {
          teacher: { select: { name: true } },
          _count: { select: { lessons: true } },
        },
      });

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="bg-white border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 min-w-9 items-center justify-center rounded-lg bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
              ЧПТК
            </span>
            <span>Читинский политехнический колледж</span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/courses"
              className="text-[var(--muted)] hover:text-[var(--foreground)] transition"
            >
              Каталог курсов
            </Link>
            <span className="text-[var(--muted)]">
              {user.name}{" "}
              ({isTeacher ? "👨‍🏫 преподаватель" : "🎓 студент"})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Личный кабинет</p>
        <h1 className="mt-2 text-3xl font-bold">Привет, {user.name}! 👋</h1>
        <p className="mt-2 max-w-2xl leading-7 text-[var(--muted)]">
          {isTeacher
            ? "Здесь ты создаёшь курсы, добавляешь уроки и смотришь, как учатся студенты."
            : "Здесь собраны твои курсы и подсказки, что сделать дальше."}
        </p>
        <div className="mt-7 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">{isTeacher ? "Для преподавателя" : "Твой следующий шаг"}</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{isTeacher ? "Подготовь курс для учеников" : "Начать учиться легко"}</h2>
            </div>
            <span className="text-sm text-slate-500">{isTeacher ? "Создай → наполни → поделись" : "Выбери → запишись → учись"}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {isTeacher ? (
              <>
                <NextStep number="1" title="Создай курс" text="Дай курсу понятное название и коротко опиши тему." href="/courses/new" action="Создать курс" />
                <NextStep number="2" title="Добавь уроки" text="Разбей тему на небольшие уроки и добавь материалы." href={courses[0] ? `/courses/${courses[0].id}` : "/courses/new"} action={courses[0] ? "Открыть мой курс" : "Сначала создай курс"} />
                <NextStep number="3" title="Следи за обучением" text="Открой сводку, чтобы увидеть курсы и активность студентов." href="/teacher/dashboard" action="Посмотреть сводку" />
              </>
            ) : (
              <>
                <NextStep number="1" title="Найди интересную тему" text="В каталоге можно посмотреть описание всех доступных курсов." href="/courses" action="Открыть каталог" />
                <NextStep number="2" title="Запишись на курс" text="Открой его карточку и нажми кнопку записи." href={courses[0] ? `/courses/${courses[0].id}` : "/courses"} action={courses[0] ? "Открыть мой курс" : "Выбрать курс"} />
                <NextStep number="3" title="Открой первый урок" text="Внутри курса уроки и тесты помогут двигаться по порядку." href={courses[0] ? `/courses/${courses[0].id}` : "/courses"} action="Перейти к урокам" />
              </>
            )}
          </div>
        </div>
        {isTeacher && (
  <div className="mt-4">
    <Link
      href="/teacher/dashboard"
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
    >
      👨‍🏫 Дашборд преподавателя
    </Link>
  </div>
)}

        {/* Заголовок секции курсов */}
        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isTeacher ? "📚 Курсы, которые ты ведёшь" : "📚 Курсы, на которые ты записан"}
            {courses.length > 0 && (
              <span className="ml-2 text-sm font-normal text-[var(--muted)]">
                ({courses.length})
              </span>
            )}
          </h2>

          {isTeacher && (
            <Link
              href="/courses/new"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
            >
              + Создать курс
            </Link>
          )}
        </div>

        {/* Список курсов */}
        {courses.length === 0 ? (
          <EmptyState isTeacher={isTeacher} />
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isTeacher={isTeacher}
              />
            ))}
          </div>
        )}

        {/* Дополнительные секции (заглушки) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
  href="/dashboard/gaps"
  className="group rounded-2xl border border-[var(--border)] bg-white p-6 hover:shadow-lg hover:border-[var(--accent)] transition"
>
  <h3 className="text-lg font-semibold group-hover:text-[var(--accent)] transition">
    🧠 Мои знания
  </h3>
  <p className="mt-2 text-sm text-[var(--muted)]">
    Карта пробелов и сильных тем на основе твоих результатов
  </p>
</Link>
<Link
  href="/dashboard/plan"
  className="group rounded-2xl border border-[var(--border)] bg-white p-6 hover:shadow-lg hover:border-[var(--accent)] transition"
>
  <h3 className="text-lg font-semibold group-hover:text-[var(--accent)] transition">
    🎯 План обучения
  </h3>
  <p className="mt-2 text-sm text-[var(--muted)]">
    Персональные задачи на основе твоих результатов
  </p>
</Link>
        </div>
      </main>
    </div>
  );
}

// ============================================
// Компоненты
// ============================================

function EmptyState({ isTeacher }: { isTeacher: boolean }) {
  return (
    <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-12 text-center">
      <div className="text-5xl mb-4">📚</div>
      <h3 className="text-lg font-semibold">
        {isTeacher ? "У тебя пока нет курсов" : "Ты пока не записан на курсы"}
      </h3>
      <p className="mt-2 text-[var(--muted)]">
        {isTeacher
          ? "Создай свой первый курс и начни делиться знаниями."
          : "Найди интересный курс и начни обучение прямо сейчас."}
      </p>
      <Link
        href={isTeacher ? "/courses/new" : "/courses"}
        className="inline-block mt-6 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition"
      >
        {isTeacher ? "Создать первый курс" : "Найти курсы"}
      </Link>
    </div>
  );
}

type CourseCardProps = {
  course: {
    id: string;
    title: string;
    description: string;
    _count: { lessons: number; enrollments?: number };
    teacher?: { name: string };
  };
  isTeacher: boolean;
};

function CourseCard({ course, isTeacher }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group rounded-2xl border border-[var(--border)] bg-white p-5 hover:shadow-lg hover:border-[var(--accent)] transition flex flex-col"
    >
      <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition line-clamp-2">
        {course.title}
      </h3>

      <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2 flex-1">
        {course.description}
      </p>

      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
        {isTeacher ? (
          <>
            <span>📚 {course._count.lessons}</span>
            <span>👥 {course._count.enrollments}</span>
          </>
        ) : (
          <>
            <span>👨‍🏫 {course.teacher?.name ?? "—"}</span>
            <span>📚 {course._count.lessons}</span>
          </>
        )}
      </div>
    </Link>
  );
}

function NextStep({
  number,
  title,
  text,
  href,
  action,
}: {
  number: string;
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="flex flex-col rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{number}</span>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{text}</p>
      <Link href={href} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50">
        {action} <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function PlaceholderCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{text}</p>
    </div>
  );
}
