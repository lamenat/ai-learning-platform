import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getCurrentUser();
  if (!admin) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  if (admin.role !== "admin") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
  }

  const pendingTeachers = await prisma.user.count({
    where: { role: "teacher", teacherApprovalStatus: "pending" },
  });

  return NextResponse.json({ pendingTeachers });
}
