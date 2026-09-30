import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ============================================
// GET /api/courses/[id] — детали курса
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        lessons: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Курс не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("=== Ошибка GET /api/courses/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/courses/[id] — удалить курс (только автор)
// ============================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json(
        { error: "Курс не найден" },
        { status: 404 }
      );
    }

    if (course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Удалять курс может только его автор" },
        { status: 403 }
      );
    }

    await prisma.course.delete({ where: { id } });

    return NextResponse.json({ message: "Курс удалён" });
  } catch (error) {
    console.error("=== Ошибка DELETE /api/courses/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}// ============================================
// PATCH /api/courses/[id] — обновить курс (только автор)
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
    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
    }
    if (course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Редактировать курс может только его автор" },
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
    if (description !== undefined && description.trim().length < 10) {
      errors.description = "Минимум 10 символов";
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Ошибка валидации", fields: errors },
        { status: 400 }
      );
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      },
    });

    return NextResponse.json({ message: "Курс обновлён", course: updated });
  } catch (error) {
    console.error("=== Ошибка PATCH /api/courses/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}