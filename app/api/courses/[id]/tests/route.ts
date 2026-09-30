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

    const { title, description } = body as {
      title?: string;
      description?: string;
    };

    const errors: Record<string, string> = {};
    if (!title || title.trim().length < 3) {
      errors.title = "Минимум 3 символа";
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