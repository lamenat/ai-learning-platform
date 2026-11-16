import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  if (admin.role !== "admin") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
  if (!course) {
    return NextResponse.json({ error: "Курс не найден" }, { status: 404 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ message: "Курс и связанные материалы удалены" });
}
