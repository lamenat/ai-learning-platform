import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    // ===== 1. Валидация =====
    const errors: Record<string, string> = {};

    if (!name || name.trim().length < 2) {
      errors.name = "Имя должно содержать минимум 2 символа";
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Некорректный email";
    }

    if (!password || password.length < 6) {
      errors.password = "Пароль должен содержать минимум 6 символов";
    }

    const allowedRoles = ["student", "teacher"];
    const finalRole = allowedRoles.includes(role ?? "") ? role! : "student";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Ошибка валидации", fields: errors },
        { status: 400 }
      );
    }

    // ===== 2. Проверка: email уже занят? =====
    const existing = await prisma.user.findUnique({
      where: { email: email!.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    // ===== 3. Хеширование пароля =====
    const passwordHash = await bcrypt.hash(password!, 10);

    // ===== 4. Создание пользователя =====
    const user = await prisma.user.create({
      data: {
        name: name!.trim(),
        email: email!.toLowerCase(),
        password: passwordHash,
        role: finalRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // password НЕ возвращаем наружу — это критично для безопасности!
      },
    });

    // ===== 5. Успешный ответ =====
    return NextResponse.json(
      {
        message: "Пользователь успешно зарегистрирован",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}