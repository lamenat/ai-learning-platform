import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ============================================
// POST /api/tests/[id]/questions
// Добавить вопрос с вариантами ответов
// ============================================
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
      include: { course: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
    }
    if (test.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Добавлять вопросы может только автор курса" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { text, answers, points } = body as {
      text?: string;
      answers?: { text: string; isCorrect: boolean }[];
      points?: number;
    };

    // ===== Валидация =====
    const errors: Record<string, string> = {};

    if (!text || text.trim().length < 3) {
      errors.text = "Минимум 3 символа";
    }
    if (!answers || !Array.isArray(answers) || answers.length < 2) {
      errors.answers = "Минимум 2 варианта ответа";
    }
    if (answers && !answers.some((a) => a.isCorrect)) {
      errors.answers = "Отметьте хотя бы один правильный ответ";
    }
    if (answers && answers.some((a) => !a.text || a.text.trim().length < 1)) {
      errors.answers = "Все варианты должны содержать текст";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Ошибка валидации", fields: errors },
        { status: 400 }
      );
    }

    // Следующий порядковый номер
    const lastQuestion = await prisma.question.findFirst({
      where: { testId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastQuestion?.order ?? 0) + 1;

    // ===== Создаём вопрос вместе с ответами =====
    const question = await prisma.question.create({
      data: {
        text: text!.trim(),
        points: points && points > 0 ? points : 1,
        order: nextOrder,
        testId,
        answers: {
          create: answers!.map((a) => ({
            text: a.text.trim(),
            isCorrect: Boolean(a.isCorrect),
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    return NextResponse.json(
      { message: "Вопрос добавлен", question },
      { status: 201 }
    );
  } catch (error) {
    console.error("=== Ошибка POST /api/tests/[id]/questions ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}