import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  if (admin.role !== "admin") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const status =
    typeof body === "object" && body !== null && "status" in body
      ? body.status
      : undefined;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Укажите решение по заявке" }, { status: 400 });
  }

  const { id } = await params;
  const teacher = await prisma.user.findUnique({ where: { id } });
  if (!teacher || teacher.role !== "teacher") {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }
  if (teacher.teacherApprovalStatus !== "pending") {
    return NextResponse.json({ error: "Заявка уже рассмотрена" }, { status: 409 });
  }

  const updatedTeacher = await prisma.user.update({
    where: { id },
    data: { teacherApprovalStatus: status },
    select: { id: true, name: true, email: true, teacherApprovalStatus: true },
  });

  return NextResponse.json({ teacher: updatedTeacher });
}
