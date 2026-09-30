import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ============================================
// GET /api/courses — список всех курсов
// ============================================
export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { lessons: true, enrollments: true },
        },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("=== Ошибка GET /api/courses ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/courses — создать курс (только teacher)
// ============================================
export async function POST(req: NextRequest) {
  try {
    // ===== 1. Проверяем авторизацию =====
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Требуется авторизация" },
        { status: 401 }
      );
    }

    if (user.role !== "teacher") {
      return NextResponse.json(
        { error: "Создавать курсы могут только преподаватели" },
        { status: 403 }
      );
    }

    // ===== 2. Валидация =====
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Некорректный запрос" },
        { status: 400 }
      );
    }

    const { title, description } = body as {
      title?: string;
      description?: string;
    };

    const errors: Record<string, string> = {};

    if (!title || title.trim().length < 3) {
      errors.title = "Название должно содержать минимум 3 символа";
    }

    if (!description || description.trim().length < 10) {
      errors.description = "Описание должно содержать минимум 10 символов";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Ошибка валидации", fields: errors },
        { status: 400 }
      );
    }

    // ===== 3. Создаём курс =====
    const course = await prisma.course.create({
      data: {
        title: title!.trim(),
        description: description!.trim(),
        teacherId: user.id,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Курс создан", course },
      { status: 201 }
    );
  } catch (error) {
    console.error("=== Ошибка POST /api/courses ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}