import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LessonChat from "@/components/LessonChat";
import LessonSummary from "@/components/LessonSummary";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = await params;
  const user = await getCurrentUser();

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        select: { id: true, title: true, teacherId: true },
      },
    },
  });

  if (!lesson || lesson.courseId !== courseId) {
    notFound();
  }

  // Все уроки курса — для навигации «предыдущий/следующий»
  const allLessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, order: true },
  });

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link
            href={`/courses/${courseId}`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            ← Назад к курсу
          </Link>

          <p className="mt-4 text-sm text-[var(--muted)]">
            {lesson.course.title} · Урок {currentIndex + 1} из{" "}
            {allLessons.length}
          </p>

          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[var(--foreground)]">
            {lesson.title}
          </h1>

          <article className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-8">
            <div className="whitespace-pre-line leading-relaxed text-[var(--foreground)]">
              {lesson.content}
            </div>
          </article>
            <LessonSummary lessonId={lesson.id} />
          {/* Навигация между уроками */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
            {prevLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                className="flex-1 rounded-lg border border-[var(--border)] bg-white px-5 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition"
              >
                ← {prevLesson.title}
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {nextLesson ? (
              <Link
                href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                className="flex-1 rounded-lg border border-[var(--border)] bg-white px-5 py-3 text-sm text-[var(--foreground)] hover:bg-[var(--surface)] transition text-right"
              >
                {nextLesson.title} →
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Плавающая кнопка AI-чата */}
      <LessonChat lessonId={lesson.id} lessonTitle={lesson.title} />
    </div>
  );
}