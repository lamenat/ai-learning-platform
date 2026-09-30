import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
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

    if (user.role !== "student") {
      return NextResponse.json(
        { error: "Записываться на курсы могут только студенты" },
        { status: 403 }
      );
    }

    const { id: courseId } = await params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json(
        { error: "Курс не найден" },
        { status: 404 }
      );
    }

    // Проверяем, не записан ли уже
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: user.id,
          courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Вы уже записаны на этот курс" },
        { status: 409 }
      );
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: user.id,
        courseId,
      },
    });

    return NextResponse.json(
      { message: "Вы записаны на курс", enrollment },
      { status: 201 }
    );
  } catch (error) {
    console.error("=== Ошибка POST /api/courses/[id]/enroll ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}