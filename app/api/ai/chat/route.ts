import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ai, AI_MODEL } from "@/lib/ai";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    // ===== 1. Авторизация =====
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    // ===== 2. Читаем тело запроса =====
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
    }

    const { message, lessonId, history } = body as {
      message?: string;
      lessonId?: string;
      history?: ChatMessage[];
    };

    if (!message || message.trim().length < 1) {
      return NextResponse.json({ error: "Введите вопрос" }, { status: 400 });
    }

    // ===== 3. Загружаем урок, если передан =====
    let lessonContext = "";
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          course: { select: { title: true } },
        },
      });

      if (lesson) {
        lessonContext = `

**Контекст урока:**
- Курс: "${lesson.course.title}"
- Урок: "${lesson.title}"
- Материал урока:
${lesson.content}
`;
      }
    }

    // ===== 4. Формируем system prompt =====
    const systemPrompt = `Ты — AI-наставник образовательной платформы. Помогаешь студенту разобраться в теме урока.
${lessonContext}

**Правила:**
1. Отвечай кратко и понятно (до 200 слов).
2. Опирайся на материал урока, но если вопроса нет в уроке — помоги общими знаниями.
3. Если студент спрашивает пример — дай пример кода/формулы.
4. Не отвечай на вопросы не по теме обучения — вежливо напомни, что ты наставник.

Отвечай на русском языке.`;

    // ===== 5. Собираем историю сообщений =====
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Добавляем историю (максимум 10 последних сообщений)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const h of recentHistory) {
        if (
          h &&
          (h.role === "user" || h.role === "assistant") &&
          typeof h.content === "string"
        ) {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }

    // Добавляем текущее сообщение
    messages.push({ role: "user", content: message.trim() });

    // ===== 6. Отправляем в DeepSeek =====
    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    const usage = completion.usage;

    return NextResponse.json({
      reply,
      usage: {
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
      },
    });
  } catch (error) {
    console.error("=== Ошибка POST /api/ai/chat ===");
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