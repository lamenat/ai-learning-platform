import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const { id: testId } = await params;
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { answers } = body as {
      answers?: { questionId: string; answerId: string }[];
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Ответы не переданы" },
        { status: 400 }
      );
    }

    // ===== Создаём попытку =====
    const attempt = await prisma.testAttempt.create({
      data: {
        studentId: user.id,
        testId,
        maxScore: test.questions.reduce((sum, q) => sum + q.points, 0),
      },
    });

    // ===== Сохраняем ответы и считаем баллы =====
    let score = 0;

    for (const q of test.questions) {
      const given = answers.find((a) => a.questionId === q.id);
      if (!given) continue;

      const chosen = q.answers.find((a) => a.id === given.answerId);
      if (!chosen) continue;

      if (chosen.isCorrect) {
        score += q.points;
      }

      await prisma.attemptAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: q.id,
          answerId: chosen.id,
        },
      });
    }

    // ===== Финализируем попытку =====
    const finished = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Тест завершён",
      attempt: {
        id: finished.id,
        score: finished.score,
        maxScore: finished.maxScore,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("=== Ошибка POST /api/tests/[id]/submit ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}