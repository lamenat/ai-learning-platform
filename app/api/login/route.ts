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

    // ===== 1. Ищем пользователя =====
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Не раскрываем, что именно неверно: email или пароль — защита от перебора
    if (!user) {
      return NextResponse.json(
        { error: "Неверный email или пароль" },
        { status: 401 }
      );
    }

    // ===== 2. Проверяем пароль =====
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
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
      httpOnly: true,          // JS не может прочитать — защита от XSS
      sameSite: "lax",         // защита от CSRF
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
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