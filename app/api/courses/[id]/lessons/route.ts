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

    const { id: courseId } = await params;
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    }
    if (course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Добавлять уроки может только автор курса" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { title, content } = body as {
      title?: string;
      content?: string;
    };

    const errors: Record<string, string> = {};
    if (!title || title.trim().length < 3) {
      errors.title = "Минимум 3 символа";
    }
    if (!content || content.trim().length < 5) {
      errors.content = "Минимум 5 символов";
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Ошибка валидации", fields: errors },
        { status: 400 }
      );
    }

    // Следующий порядковый номер
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastLesson?.order ?? 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        title: title!.trim(),
        content: content!.trim(),
        order: nextOrder,
        courseId,
      },
    });

    return NextResponse.json(
      { message: "Урок создан", lesson },
      { status: 201 }
    );
  } catch (error) {
    console.error("=== Ошибка POST /api/courses/[id]/lessons ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}