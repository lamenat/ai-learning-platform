import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ============================================
// GET /api/courses/[id]/tests — список тестов курса
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params;

    const tests = await prisma.test.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("=== Ошибка GET /api/courses/[id]/tests ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/courses/[id]/tests — создать тест (только автор курса)
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

    const { id: courseId } = await params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    }
    if (course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Создавать тесты может только автор курса" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { title, description, questions } = body as {
      title?: string;
      description?: string;
      questions?: unknown;
    };

    const errors: Record<string, string> = {};
    if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 160) {
      errors.title = "Название должно содержать от 3 до 160 символов";
    }
    if (
      description !== undefined &&
      (typeof description !== "string" || description.trim().length > 4000)
    ) {
      errors.description = "Описание не должно превышать 4000 символов";
    }
    if (
      questions !== undefined &&
      (!Array.isArray(questions) ||
        questions.length < 3 ||
        questions.length > 10 ||
        questions.some((question) => {
          if (
            typeof question !== "object" ||
            question === null ||
            typeof question.text !== "string" ||
            question.text.trim().length < 3 ||
            question.text.trim().length > 1000 ||
            !Array.isArray(question.answers) ||
            question.answers.length < 2 ||
            question.answers.length > 6
          ) {
            return true;
          }

          return (
            question.answers.some(
              (answer) =>
                typeof answer !== "object" ||
                answer === null ||
                typeof answer.text !== "string" ||
                answer.text.trim().length === 0 ||
                answer.text.trim().length > 300 ||
                typeof answer.isCorrect !== "boolean"
            ) ||
            question.answers.filter(
              (answer) => typeof answer === "object" && answer !== null && answer.isCorrect === true
            ).length !== 1
          );
        }))
    ) {
      errors.questions = "В тесте должно быть от 3 до 10 вопросов с одним правильным ответом в каждом";
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Ошибка валидации", fields: errors },
        { status: 400 }
      );
    }

    const test = await prisma.test.create({
      data: {
        title: title!.trim(),
        description: (description ?? "").trim(),
        courseId,
        ...(Array.isArray(questions) && questions.length > 0
          ? {
              questions: {
                create: questions.map((question, index) => ({
                  text: question.text.trim(),
                  points: 1,
                  order: index,
                  answers: {
                    create: question.answers.map((answer) => ({
                      text: answer.text.trim(),
                      isCorrect: answer.isCorrect,
                    })),
                  },
                })),
              },
            }
          : {}),
      },
    });

    return NextResponse.json({ message: "Тест создан", test }, { status: 201 });
  } catch (error) {
    console.error("=== Ошибка POST /api/courses/[id]/tests ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
