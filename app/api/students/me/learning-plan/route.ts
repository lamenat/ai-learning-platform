import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Status = "gap" | "medium" | "strong";

function statusFor(percent: number): Status {
  if (percent >= 80) return "strong";
  if (percent >= 60) return "medium";
  return "gap";
}

function reasonFor(status: Status, percent: number): string {
  if (status === "gap") {
    return `Результат ${percent}% — это пробел. Стоит разобраться в теме.`;
  }
  if (status === "medium") {
    return `Результат ${percent}%. Тема освоена наполовину — можно подтянуть.`;
  }
  return `Результат ${percent}% — сильная тема. Но повторение не помешает.`;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    // Все завершённые попытки студента
    const attempts = await prisma.testAttempt.findMany({
      where: {
        studentId: user.id,
        completedAt: { not: null },
      },
      include: {
        test: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });

    // Группировка по тестам — берём лучшую попытку
    const byTestMap = new Map<
      string,
      {
        testId: string;
        testTitle: string;
        courseId: string;
        courseTitle: string;
        attemptsCount: number;
        bestScore: number;
        maxScore: number;
      }
    >();

    for (const a of attempts) {
      const existing = byTestMap.get(a.testId);
      if (!existing) {
        byTestMap.set(a.testId, {
          testId: a.testId,
          testTitle: a.test.title,
          courseId: a.test.course.id,
          courseTitle: a.test.course.title,
          attemptsCount: 1,
          bestScore: a.score,
          maxScore: a.maxScore,
        });
      } else {
        existing.attemptsCount += 1;
        existing.bestScore = Math.max(existing.bestScore, a.score);
      }
    }

    // Формируем задачи
    const tasks = Array.from(byTestMap.values()).map((t) => {
      const percent =
        t.maxScore > 0 ? Math.round((t.bestScore / t.maxScore) * 100) : 0;
      const status = statusFor(percent);
      return {
        testId: t.testId,
        testTitle: t.testTitle,
        courseId: t.courseId,
        courseTitle: t.courseTitle,
        attemptsCount: t.attemptsCount,
        bestScore: t.bestScore,
        maxScore: t.maxScore,
        percent,
        status,
        priority: 0,
        reason: reasonFor(status, percent),
      };
    });

    // Сортировка: сначала пробелы (по возрастанию %), потом medium, потом strong
    const order: Record<Status, number> = { gap: 0, medium: 1, strong: 2 };
    tasks.sort((a, b) => {
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return a.percent - b.percent;
    });

    // Проставляем priority (1, 2, 3, ...) только для gap и medium
    let priority = 1;
    for (const t of tasks) {
      if (t.status === "gap" || t.status === "medium") {
        t.priority = priority++;
      }
    }

    // Сводка
    const totalTests = tasks.length;
    const gaps = tasks.filter((t) => t.status === "gap").length;
    const medium = tasks.filter((t) => t.status === "medium").length;
    const strong = tasks.filter((t) => t.status === "strong").length;

    return NextResponse.json({
      summary: {
        totalTests,
        gaps,
        medium,
        strong,
        hasPlan: gaps + medium > 0,
      },
      tasks: tasks.filter((t) => t.priority > 0), // только приоритетные
      allTasks: tasks, // всё, включая сильные
    });
  } catch (error) {
    console.error("=== Ошибка GET /api/students/me/learning-plan ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}