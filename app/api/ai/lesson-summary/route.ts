import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ai, AI_MODEL } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { lessonId } = body as { lessonId?: string };

    if (!lessonId) {
      return NextResponse.json({ error: "Не указан lessonId" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: { select: { title: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Урок не найден" }, { status: 404 });
    }

    if (!lesson.content || lesson.content.trim().length < 20) {
      return NextResponse.json(
        { error: "Текст урока слишком короткий для резюме" },
        { status: 400 }
      );
    }

    const prompt = `Ты — методист образовательной платформы. Сделай краткое резюме урока.

**Курс:** ${lesson.course.title}
**Урок:** ${lesson.title}
**Материал урока:**
${lesson.content}

**Задача:** Выдели 3–5 ключевых тезисов урока. Каждый тезис — одна короткая фраза.
Формат ответа: список пунктов, каждый с новой строки, начиная с «• ».
Отвечай кратко и по существу, на русском языке.`;

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Ты — методист. Возвращаешь только маркированный список ключевых тезисов, без вступлений и заключений.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    const summary = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("=== Ошибка POST /api/ai/lesson-summary ===");
    console.error(error);
    return NextResponse.json(
      {
        error: "AI не ответил",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}