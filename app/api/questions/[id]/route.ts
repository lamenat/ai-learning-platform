import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ============================================
// DELETE /api/questions/[id] — удалить вопрос (только автор курса)
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
    const question = await prisma.question.findUnique({
      where: { id },
      include: { test: { include: { course: true } } },
    });

    if (!question) {
      return NextResponse.json({ error: "Вопрос не найден" }, { status: 404 });
    }
    if (question.test.course.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Удалять вопросы может только автор курса" },
        { status: 403 }
      );
    }

    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ message: "Вопрос удалён" });
  } catch (error) {
    console.error("=== Ошибка DELETE /api/questions/[id] ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}