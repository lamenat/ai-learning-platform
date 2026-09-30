import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ============================================
// GET /api/tests/[id] — получить тест с вопросами
// Правильные ответы скрыты от студентов
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, teacherId: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            answers: {
              orderBy: { id: "asc" },
            },
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
    }

    // Преподаватель-автор видит правильные ответы, студенты — нет
    const isAuthor = user?.id === test.course.teacherId;

    const sanitizedQuestions = test.questions.map((q) => ({
      id: q.id,
      text: q.text,
      order: q.order,
      points: q.points,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        // правильный ответ отдаём только автору
        ...(isAuthor && { isCorrect: a.isCorrect }),
      })),
    }));

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        courseId: test.courseId,
        course: test.course,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    console.error("=== Ошибка GET /api/tests/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH /api/tests/[id] — обновить тест (только автор курса)
// ============================================
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const { id } = await params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
    }
    if (test.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Редактировать тест может только автор курса" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { title, description } = body as {
      title?: string;
      description?: string;
    };

    const errors: Record<string, string> = {};
    if (title !== undefined && title.trim().length < 3) {
      errors.title = "Минимум 3 символа";
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Ошибка валидации", fields: errors },
        { status: 400 }
      );
    }

    const updated = await prisma.test.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      },
    });

    return NextResponse.json({ message: "Тест обновлён", test: updated });
  } catch (error) {
    console.error("=== Ошибка PATCH /api/tests/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/tests/[id] — удалить тест (только автор курса)
// ============================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const { id } = await params;
    const test = await prisma.test.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!test) {
      return NextResponse.json({ error: "Тест не найден" }, { status: 404 });
    }
    if (test.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Удалять тест может только автор курса" },
        { status: 403 }
      );
    }

    await prisma.test.delete({ where: { id } });

    return NextResponse.json({ message: "Тест удалён" });
  } catch (error) {
    console.error("=== Ошибка DELETE /api/tests/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}