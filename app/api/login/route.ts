import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Введите email и пароль" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD;
    const isConfiguredAdmin = Boolean(
      configuredAdminEmail &&
        configuredAdminPassword &&
        configuredAdminPassword.length >= 12 &&
        normalizedEmail === configuredAdminEmail &&
        password === configuredAdminPassword
    );

    // Создаём или обновляем администратора только по паре секретов из окружения.
    let user = isConfiguredAdmin
      ? await (async () => {
          const passwordHash = await bcrypt.hash(configuredAdminPassword!, 10);
          return prisma.user.upsert({
            where: { email: normalizedEmail },
            create: {
              email: normalizedEmail,
              name: "Администратор",
              password: passwordHash,
              role: "admin",
              teacherApprovalStatus: "approved",
            },
            update: {
              name: "Администратор",
              password: passwordHash,
              role: "admin",
              teacherApprovalStatus: "approved",
            },
          });
        })()
      : await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Не раскрываем, что именно неверно: email или пароль — защита от перебора.
    if (!isConfiguredAdmin && (!user || !(await bcrypt.compare(password, user.password)))) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    if (user?.role === "teacher" && user.teacherApprovalStatus === "pending") {
      return NextResponse.json(
        { error: "Заявка преподавателя ещё ожидает подтверждения администратора" },
        { status: 403 }
      );
    }
    if (user?.role === "teacher" && user.teacherApprovalStatus === "rejected") {
      return NextResponse.json(
        { error: "Заявка отклонена. Обратитесь к администратору колледжа" },
        { status: 403 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // ===== 3. Успех — ставим httpOnly cookie с userId =====
    const res = NextResponse.json({
      message: "Вход выполнен",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.set({
  name: SESSION_COOKIE,
  value: user.id,
  httpOnly: true,
  sameSite: "none", // Ключевое изменение: None
  secure: true,     // Обязательно: при SameSite=None требуется Secure
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
});

    return res;
  } catch (error) {
    console.error("=== Ошибка логина ===");
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
