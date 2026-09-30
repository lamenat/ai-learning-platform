import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type TestStat = {
  testId: string;
  testTitle: string;
  courseId: string;
  courseTitle: string;
  attempts: number;
  bestScore: number;
  maxScore: number;
  percent: number;
  status: "strong" | "medium" | "gap";
};

function statusFor(percent: number): "strong" | "medium" | "gap" {
  if (percent >= 80) return "strong";
  if (percent >= 60) return "medium";
  return "gap";
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
      orderBy: { completedAt: "desc" },
    });

    // ===== Общая статистика =====
    const totalAttempts = attempts.length;
    const totalScore = attempts.reduce((s, a) => s + a.score, 0);
    const totalMaxScore = attempts.reduce((s, a) => s + a.maxScore, 0);
    const overallPercent =
      totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;

    // ===== Группировка по тестам — берём лучшую попытку =====
    const byTestMap = new Map<
      string,
      {
        testId: string;
        testTitle: string;
        courseId: string;
        courseTitle: string;
        attempts: number;
        bestScore: number;
        maxScore: number;
      }
    >();

    for (const a of attempts) {
      const key = a.testId;
      const existing = byTestMap.get(key);
      if (!existing) {
        byTestMap.set(key, {
          testId: a.testId,
          testTitle: a.test.title,
          courseId: a.test.course.id,
          courseTitle: a.test.course.title,
          attempts: 1,
          bestScore: a.score,
          maxScore: a.maxScore,
        });
      } else {
        existing.attempts += 1;
        existing.bestScore = Math.max(existing.bestScore, a.score);
      }
    }

    const tests: TestStat[] = Array.from(byTestMap.values()).map((t) => {
      const percent =
        t.maxScore > 0 ? Math.round((t.bestScore / t.maxScore) * 100) : 0;
      return {
        ...t,
        percent,
        status: statusFor(percent),
      };
    });

    // ===== Группировка по курсам =====
    const byCourseMap = new Map<
      string,
      {
        courseId: string;
        courseTitle: string;
        attempts: number;
        score: number;
        maxScore: number;
        tests: TestStat[];
      }
    >();

    for (const t of tests) {
      const existing = byCourseMap.get(t.courseId);
      if (!existing) {
        byCourseMap.set(t.courseId, {
          courseId: t.courseId,
          courseTitle: t.courseTitle,
          attempts: t.attempts,
          score: t.bestScore,
          maxScore: t.maxScore,
          tests: [t],
        });
      } else {
        existing.attempts += t.attempts;
        existing.score += t.bestScore;
        existing.maxScore += t.maxScore;
        existing.tests.push(t);
      }
    }

    const byCourse = Array.from(byCourseMap.values()).map((c) => ({
      ...c,
      percent:
        c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0,
    }));

    // ===== Пробелы и сильные стороны =====
    const gaps = tests.filter((t) => t.status === "gap");
    const strengths = tests.filter((t) => t.status === "strong");

    return NextResponse.json({
      overall: {
        totalAttempts,
        totalScore,
        totalMaxScore,
        percent: overallPercent,
      },
      byCourse,
      tests,
      gaps,
      strengths,
    });
  } catch (error) {
    console.error("=== Ошибка GET /api/students/me/stats ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}