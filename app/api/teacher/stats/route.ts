import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }
    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "Доступно только преподавателям" },
        { status: 403 }
      );
    }

    // ===== 1. Все курсы преподавателя =====
    const courses = await prisma.course.findMany({
      where: { teacherId: user.id },
      include: {
        tests: {
          include: {
            questions: true,
            attempts: {
              where: { completedAt: { not: null } },
              include: { student: { select: { id: true, name: true, email: true } } },
            },
          },
        },
        enrollments: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    const courseIds = courses.map((c) => c.id);

    // ===== 2. Все попытки по курсам преподавателя =====
    const allAttempts = courses.flatMap((c) =>
      c.tests.flatMap((t) => t.attempts.map((a) => ({ ...a, test: t, course: c })))
    );

    // ===== 3. Сводка =====
    const totalScore = allAttempts.reduce((s, a) => s + a.score, 0);
    const totalMax = allAttempts.reduce((s, a) => s + a.maxScore, 0);
    const avgPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    const uniqueStudents = new Set<string>();
    for (const c of courses) {
      for (const e of c.enrollments) uniqueStudents.add(e.student.id);
    }

    const testsCount = courses.reduce((s, c) => s + c.tests.length, 0);

    // ===== 4. Разбивка по курсам =====
    const coursesStats = courses.map((c) => {
      const courseAttempts = allAttempts.filter((a) => a.course.id === c.id);
      const cScore = courseAttempts.reduce((s, a) => s + a.score, 0);
      const cMax = courseAttempts.reduce((s, a) => s + a.maxScore, 0);
      const cAvg = cMax > 0 ? Math.round((cScore / cMax) * 100) : 0;

      // Самый сложный тест
      const testStats = c.tests.map((t) => {
        const tAttempts = courseAttempts.filter((a) => a.test.id === t.id);
        const tScore = tAttempts.reduce((s, a) => s + a.score, 0);
        const tMax = tAttempts.reduce((s, a) => s + a.maxScore, 0);
        const tAvg = tMax > 0 ? Math.round((tScore / tMax) * 100) : 0;
        return { testId: t.id, testTitle: t.title, avgPercent: tAvg, attemptsCount: tAttempts.length };
      });

      const hardest = testStats
        .filter((t) => t.attemptsCount > 0)
        .sort((a, b) => a.avgPercent - b.avgPercent)[0] ?? null;

      return {
        courseId: c.id,
        courseTitle: c.title,
        studentsCount: c.enrollments.length,
        testsCount: c.tests.length,
        avgPercent: cAvg,
        hardestTest: hardest,
      };
    });

    // ===== 5. Топ ошибочных вопросов =====
    const questionStats = new Map<
      string,
      {
        questionId: string;
        questionText: string;
        testTitle: string;
        wrongCount: number;
        totalCount: number;
      }
    >();

    for (const c of courses) {
      for (const t of c.tests) {
        for (const q of t.questions) {
          const entry = questionStats.get(q.id) ?? {
            questionId: q.id,
            questionText: q.text,
            testTitle: t.title,
            wrongCount: 0,
            totalCount: 0,
          };
          for (const a of t.attempts) {
            entry.totalCount += 1;
            const ans = await prisma.attemptAnswer.findUnique({
              where: {
                attemptId_questionId: {
                  attemptId: a.id,
                  questionId: q.id,
                },
              },
              include: { answer: { select: { isCorrect: true } } },
            });
            if (ans && !ans.answer.isCorrect) entry.wrongCount += 1;
          }
          questionStats.set(q.id, entry);
        }
      }
    }

    const topMistakes = Array.from(questionStats.values())
      .filter((q) => q.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 10);

    // ===== 6. Список студентов =====
    const studentMap = new Map<
      string,
      {
        studentId: string;
        studentName: string;
        studentEmail: string;
        coursesCount: number;
        attemptsCount: number;
        score: number;
        maxScore: number;
        lastActivityAt: Date | null;
      }
    >();

    for (const c of courses) {
      for (const e of c.enrollments) {
        const s = e.student;
        const entry = studentMap.get(s.id) ?? {
          studentId: s.id,
          studentName: s.name,
          studentEmail: s.email,
          coursesCount: 0,
          attemptsCount: 0,
          score: 0,
          maxScore: 0,
          lastActivityAt: null as Date | null,
        };
        entry.coursesCount += 1;
        studentMap.set(s.id, entry);
      }
    }

    for (const a of allAttempts) {
      const entry = studentMap.get(a.studentId);
      if (!entry) continue;
      entry.attemptsCount += 1;
      entry.score += a.score;
      entry.maxScore += a.maxScore;
      if (!entry.lastActivityAt || (a.completedAt && a.completedAt > entry.lastActivityAt)) {
        entry.lastActivityAt = a.completedAt;
      }
    }

    const students = Array.from(studentMap.values())
      .map((s) => ({
        ...s,
        avgPercent: s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : 0,
      }))
      .sort((a, b) => b.attemptsCount - a.attemptsCount);

    return NextResponse.json({
      summary: {
        coursesCount: courses.length,
        studentsCount: uniqueStudents.size,
        testsCount,
        avgPercent,
      },
      courses: coursesStats,
      topMistakes,
      students,
    });
  } catch (error) {
    console.error("=== Ошибка GET /api/teacher/stats ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}