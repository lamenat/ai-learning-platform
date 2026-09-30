import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ============================================
// GET /api/attempts/[id]
// Детали попытки (для страницы результата)
// ============================================
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const { id } = await params;
    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            course: { select: { id: true, title: true, teacherId: true } },
            questions: {
              orderBy: { order: "asc" },
              include: {
                answers: { orderBy: { id: "asc" } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Попытка не найдена" }, { status: 404 });
    }

    // Только сам студент или автор курса могут смотреть
    const isOwner = attempt.studentId === user.id;
    const isTeacher = attempt.test.course.teacherId === user.id;
    if (!isOwner && !isTeacher) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error("=== Ошибка GET /api/attempts/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}